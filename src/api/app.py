from flask import Flask, request, Response, jsonify, redirect
import json
import sqlite3
import bcrypt
from threading import Lock
lock = Lock()

# Secret... (TODO REMOVE BEFORE FINAL SUBMISSION)
query_pw_hash = b'$2b$12$pt1UpMDSEO8snyS1MS3pcu5or6WG6ey80F9UrVH26kyYqrMIhyjVq'

con = sqlite3.connect("data.db", check_same_thread=False)
cur = con.cursor()
# Create the database!
cur.executescript("""
    CREATE TABLE IF NOT EXISTS Users(
        ID INTEGER PRIMARY KEY,
        Username TEXT UNIQUE,
        Email TEXT,
        pwHash TINYBLOB
    );
    CREATE TABLE IF NOT EXISTS Documents(
        ID INTEGER PRIMARY KEY,
        UserID INT,
        Title TEXT,
        DateCreated DATETIME DEFAULT CURRENT_DATE,
        LastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(UserID) REFERENCES Users(ID)
    );
    CREATE TABLE IF NOT EXISTS TextBlocks(
        ID INTEGER PRIMARY KEY,
        UserID INT,
        Title TEXT,
        Content TEXT,
        DateCreated DATETIME DEFAULT CURRENT_DATE,
        LastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(UserID) REFERENCES Users(ID)
    );
    CREATE TABLE IF NOT EXISTS DocumentBlocks(
        DocumentID INT,
        BlockID INT,
        Position INT,
        FOREIGN KEY(DocumentID) REFERENCES Documents(ID),
        FOREIGN KEY(BlockID) REFERENCES TextBlocks(ID)
    );
""")

app = Flask(__name__)
from flask_cors import CORS
CORS(app)

# Endpoint to manually execute database queries
# WARNING: ONLY USE WHEN DESPERATE. ALSO THIS IS VERY UNSAFE SO:
# TODO REMOVE BEFORE FINAL SUBMISSION.
@app.get("/query")
def run_query():
    query = request.args.get("q")
    password = request.args.get("p")
    if password is None: return jsonify({"Error": "Invalid password"})
    
    success = bcrypt.checkpw(password.encode("utf-8"), query_pw_hash)
    if not success: return jsonify({"Error": "Invalid password"})

    result = cur.execute(query)
    con.commit()
    return jsonify(result.fetchall())

# Gets all users in the database
@app.get("/users")
def get_users():
    result = cur.execute("SELECT Username, Email FROM Users;")
    return jsonify(result.fetchall())

# Gets all of a user's documents
# args: id - the user's ID
@app.get("/documents")
def get_documents():
    id = request.args.get("id")
    # Lock the thread otherwise sqlite gets mad idk why
    lock.acquire(True)
    result = cur.execute("""
                         SELECT Users.ID, Documents.ID, Documents.Title, Documents.DateCreated, Documents.LastUpdated 
                         FROM Users
                         INNER JOIN Documents ON Documents.UserID = Users.ID
                         ORDER BY Documents.LastUpdated DESC;
                         """)
    results = result.fetchall()
    # Release the thread
    lock.release()
    # List comprehension to select only the specific user's documents
    user_docs = [doc for doc in results if doc[0] == int(id)]
    return jsonify(user_docs)

# Gets the title of one document
# args: id - the ID of the document
@app.get("/documents/title")
def get_document_title():
    id = request.args.get("id")
    lock.acquire(True)
    result = cur.execute("SELECT Title FROM Documents WHERE ID = ?;", (id,)).fetchone()[0]
    lock.release()
    return jsonify(result)

# Gets all of a user's text blocks
# args: id - the user's ID
@app.get("/blocks")
def get_blocks():
    id = request.args.get("id")
    lock.acquire(True)
    result = cur.execute("""
                         SELECT Users.ID, TextBlocks.ID, TextBlocks.Title, TextBlocks.Content, 
                            TextBlocks.DateCreated, TextBlocks.LastUpdated
                         FROM Users
                         INNER JOIN TextBlocks ON TextBlocks.UserID = Users.ID
                         ORDER BY TextBlocks.LastUpdated DESC;""")
    results = result.fetchall()
    lock.release()
    user_blocks = [block for block in results if block[0] == int(id)]
    return jsonify(user_blocks)

# Gets one text block (for the text block editor)
# args: blockID - the ID of the block to get
@app.get("/blocks/one")
def get_one_block():
    block_id = request.args.get("blockID")
    print(block_id)
    lock.acquire(True)
    result = cur.execute("SELECT Title, Content FROM TextBlocks WHERE ID = ?", (block_id,)).fetchone()
    lock.release()
    return jsonify(result)

# Gets the text blocks belonging to a document
# args: docid - the ID of the document
@app.get("/documentblocks")
def get_document_blocks():
    doc_id = request.args.get("docid")
    lock.acquire(True)
    result = cur.execute("""
                         SELECT DocumentBlocks.DocumentID, TextBlocks.ID, TextBlocks.Title,
                            TextBlocks.Content, DocumentBlocks.Position
                         FROM ((DocumentBlocks
                         INNER JOIN Documents ON Documents.ID = DocumentBlocks.DocumentID)
                         INNER JOIN TextBlocks ON TextBlocks.ID = DocumentBlocks.BlockID)
                         ORDER BY DocumentBlocks.Position;
                         """)
    results = result.fetchall()
    lock.release()
    # List comp to select only the user's document's blocks
    user_doc_blocks = [doc for doc in results if doc[0] == int(doc_id)]
    return jsonify(user_doc_blocks)

# Checks if the given username is already in the database
# args: username - the username to check
@app.get("/users/check")
def check_username():
    username = request.args.get("username")
    user_exists = cur.execute("SELECT 1 FROM Users WHERE Username = ?", (username,)).fetchone()
    return jsonify({"available": user_exists is None}) # False if the username is taken

# Creates a new user
# body format:
#   username: String
#   password: String
#   email: String
@app.post("/users/new")
def create_account():
    result = json.loads(request.data)
    pw = result["password"]
    pw_bytes = pw.encode("utf-8")
    pw_hash = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())
    try:
        cur.execute(f"""INSERT INTO Users (Username, Email, pwHash) VALUES
                    ('{result["username"]}', '{result["email"]}', ?)""", ([sqlite3.Binary(pw_hash)]))
        con.commit()
        id = cur.execute("SELECT ID FROM Users WHERE Username = ?", (result["username"],)).fetchall()[0][0]
        
    except sqlite3.IntegrityError as e:
        print(e)
        return redirect("http://csse280.csse.rose-hulman.edu:22050/signup")
    
    return jsonify({"id": id})

# Logs into an account
# body format:
#   username: String
#   password: String
@app.post("/users/login")
def login():
    result = json.loads(request.data)
    username = result["username"]
    password = result["password"]
    query_result = cur.execute("SELECT pwHash, ID FROM Users WHERE Username = ?", (username,)).fetchone()
    if query_result is None:    # if no record with the username exists
        return jsonify({"success": False})
    
    pw_hash = query_result[0]
    id = query_result[1]
    successful = bcrypt.checkpw(password.encode("utf-8"), pw_hash)
    
    return jsonify({"success": successful, "id": id})

# Creates a new document
# body format:
#   id: integer (the user's ID)
@app.post("/documents")
def create_document():
    result = json.loads(request.data)
    lock.acquire(True)
    cur.execute("INSERT INTO Documents (UserID, Title) VALUES (?, ?);", (result["id"], "New Document",))
    new_id = cur.execute("SELECT last_insert_rowid();").fetchone()[0]
    con.commit()
    lock.release()
    return jsonify({"newid": new_id})

# Creates a new text block
# body format:
#   userID: integer
#   docID: integer || null (if the block does not belong to a document, i.e. created in the text block page)
#   pos: integer (position in the document, if the block belongs to a document)
@app.post("/blocks")
def create_block():
    result = json.loads(request.data)
    user_id = result["userID"]
    doc_id = result["docID"]
    lock.acquire(True)
    cur.execute("INSERT INTO TextBlocks (UserID, Title) VALUES (?, ?);", (user_id, "New Text Block",))
    new_id = cur.execute("SELECT last_insert_rowid();").fetchone()[0]
    if doc_id is not None:
        position = result["pos"]
        cur.execute("INSERT INTO DocumentBlocks VALUES (?, last_insert_rowid(), ?);", (doc_id, position))
    lock.release()
    return {"newid": new_id}

@app.put("/users")
def update_password():
    # TODO update the user's password
    return

# Updates the user's document with the given title
@app.put("/documents")
def update_document():
    # TODO update the user's document
    result = json.loads(request.data)
    print(result)
    id = result["id"]
    new_title = result["title"]
    lock.acquire(True)
    cur.execute("UPDATE Documents SET Title = ? WHERE ID = ?;", (new_title, id,))
    con.commit()
    lock.release()
    return {"response": "success"}

# Updates a text block's content
# body format:
#   id: integer (the text block ID)
#   content: String (the new content)
@app.put("/blocks/content")
def update_block_content():
    result = json.loads(request.data)
    block_id = result["id"]
    content = result["content"]
    lock.acquire(True)
    cur.execute("""
                UPDATE TextBlocks
                SET Content = ?
                WHERE ID = ?
                """, (content, block_id,))
    con.commit()
    lock.release()
    return {"response": "success"}

# Updates a text block's title
# body format:
#   id: integer (the text block ID)
#   title: String (the new title)
@app.put("/blocks/title")
def update_block_title():
    result = json.loads(request.data)
    block_id = result["id"]
    title = result["title"]
    lock.acquire(True)
    cur.execute("""
                UPDATE TextBlocks
                SET Title = ?
                WHERE ID = ?
                """, (title, block_id,))
    con.commit()
    lock.release()
    return {"response": "success"}

# Updates the order of text blocks in a document
# body format:
#   [Array of objects]
#       id: integer (the text block ID)
#       position: integer (the text block's position in the document)
@app.put("/documentblocks")
def update_doc_order():
    result = json.loads(request.data)
    for block in result:
        lock.acquire(True)
        cur.execute("""
                    UPDATE DocumentBlocks
                    SET Position = ?
                    WHERE BlockID = ?
                    """, (block["position"], block["id"]))
        con.commit()
        lock.release()

    return {"response": "success"}

@app.delete("/users")
def delete_account():
    # TODO delete the account
    return

# Deletes a document
# body format:
#   id: integer (the document's ID)
@app.delete("/documents")
def delete_document():
    result = json.loads(request.data)
    doc_id = result["id"]
    lock.acquire(True)
    cur.execute("DELETE FROM Documents WHERE ID = ?;", (doc_id,))
    cur.execute("DELETE FROM DocumentBlocks WHERE DocumentID = ?;", (doc_id,))
    con.commit()
    lock.release()
    return {"response": "success"}

# Deletes a text block
# body format:
#   id: integer (the text block's ID)
@app.delete("/blocks")
def delete_block():
    # TODO delete the user's text block
    result = json.loads(request.data)
    block_id = result["id"]
    lock.acquire(True)
    cur.execute("DELETE FROM TextBlocks WHERE ID = ?", (block_id,))
    cur.execute("DELETE FROM DocumentBlocks WHERE BlockID = ?;", (block_id,))
    con.commit()
    lock.release()
    return {"response": "success"}

# Deletes a text block from a document
# DOES NOT delete the actual block! This only removes it from the document.
# body format:
#   blockID: integer (text block ID to remove)
#   docID: integer (document that contains the text block to remove)
@app.delete("/documentblocks")
def delete_block_from_doc():
    result = json.loads(request.data)
    block_id = result["blockID"]
    doc_id = result["docID"]
    lock.acquire(True)
    cur.execute("DELETE FROM DocumentBlocks WHERE DocumentID = ? AND BlockID = ?;", (doc_id, block_id,))
    lock.release()
    return {"response": "success"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=22051, debug=True)