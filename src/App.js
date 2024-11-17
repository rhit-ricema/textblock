import { useEffect, useState, useRef, useCallback } from 'react';
import './App.css';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { EditText, EditTextarea } from 'react-edit-text';
import 'react-edit-text/dist/index.css';


function App() {
    const [loggedIn, setLoggedIn] = useState(() => JSON.parse(localStorage.getItem("loggedIn")) || false);
    const [blockSelected, setBlockSelected] = useState(() => JSON.parse(localStorage.getItem("blockSelected")) || false);
    const [userID, setUserID] = useState(() => JSON.parse(localStorage.getItem("id")) || null);
    const [docID, setDocID] = useState(() => JSON.parse(localStorage.getItem("docid")) || null);
    const [blockID, setBlockID] = useState(() => JSON.parse(localStorage.getItem("blockid")) || null);

    // Writes each state to local storage to preserve state between refreshes/page opens
    useEffect(() => {
        localStorage.setItem("loggedIn", JSON.stringify(loggedIn));
    }, [loggedIn]);
    useEffect(() => {
        localStorage.setItem("blockSelected", JSON.stringify(blockSelected));
    }, [blockSelected]);
    useEffect(() => {
        localStorage.setItem("id", JSON.stringify(userID));
    }, [userID]);
    useEffect(() => {
        localStorage.setItem("docid", JSON.stringify(docID));
    }, [docID]);
    useEffect(() => {
        localStorage.setItem("blockid", JSON.stringify(blockID));
    }, [blockID]);

    return (
        <div className="App">
            {/* display the right navigation */}
            {loggedIn ? <SideNav setLoggedIn={setLoggedIn} blockSelected={blockSelected} 
            setBlockSelected={setBlockSelected} setUserID={setUserID} /> : <Navigation />}
            <Routes>
                <Route exact path="/" Component={() => Home(loggedIn)} />
                <Route exact path="/about" Component={About} />
                <Route exact path="/howitworks" Component={HowItWorks} />
                <Route exact path="/faqs" Component={FAQs} />
                <Route exact path="/login" Component={() => Login(setLoggedIn, setUserID)} />
                <Route exact path="/signup" Component={() => Signup(setLoggedIn, setUserID)} />
                <Route exact path="/documents" Component={() => Documents(userID, docID, setDocID)}/>
                <Route exact path="/textblocks" Component={() => TextBlocks(userID, blockID, setBlockID)} />
                <Route exact path="/documents/edit" Component={() => DocumentEditor(userID, docID, setBlockID)} />
                <Route exact path="/textblocks/edit" Component={() => BlockEditor(blockID)} />
            </Routes>
        </div>
    );
}

const Navigation = () => (
    <nav>
        <ul className="navBar">
            {/* Could not get styling to be reset for the NavLinks withought using inline styling */}
            <li><NavLink to="/"><img src="TextBlock_LogoDark.png" alt="Logo" /></NavLink></li>
            <li className="textB"><NavLink to="/about" style={{ textDecoration: "none", color: '#2F2235' }}>About Us</NavLink></li>
            <li className="textB"><NavLink to="/howitworks" style={{ textDecoration: "none", color: '#2F2235' }}>How It Works</NavLink></li>
            <li className="textB"><NavLink to="/faqs" style={{ textDecoration: "none", color: '#2F2235' }}>FAQs</NavLink></li>

        </ul>

        <ul className="in">
            <li id="log"><NavLink to="/login" style={{ textDecoration: "none", color: 'white' }}>Login</NavLink></li>
            <li id="sign"><NavLink to="/signup" style={{ textDecoration: "none", color: 'white' }}>Sign Up</NavLink></li>
        </ul>

    </nav>
);

const SideNav = ({setLoggedIn, setUserID, blockSelected, setBlockSelected}) => {
    const navigate = useNavigate();
    function clickHandler() {
        setLoggedIn(false);
        setUserID(null);
        navigate("/");
    }
    function selectBlockHandler(){
        setBlockSelected(true);
    }
    function selectDocHandler(){
        setBlockSelected(false);
    }
    return (
        <aside id="sideNav">
            <nav>
                <ul>
                    <li><img src="TextBlock_LogoDark.png" alt="Logo" id = "logo"/></li>
                    <li id = "docIcon" >
                        <div id = "docSelect" className={blockSelected ? '':'selected'}>
                            <NavLink to="/documents" onClick={selectDocHandler}><img src="docIcon.png" alt="Document Icon"/></NavLink>
                            <NavLink to="/documents" onClick={selectDocHandler} style={{ textDecoration: "none", color: '#2F2235' }}>Documents</NavLink>
                        </div>
                    </li>
                    <li id = "blockIcon">
                        <div id = "blockSelect" className={blockSelected ? 'selected':''}>
                            <NavLink to="/textblocks" onClick={selectBlockHandler}><img src="blockIcon.png" alt="Text Block Icon"/></NavLink>
                            <NavLink to="/textblocks" onClick={selectBlockHandler} style={{ textDecoration: "none", color: '#2F2235' }}>Text Blocks</NavLink>
                        </div>
                    </li>
                </ul>
                <button onClick={clickHandler} className='bigButt'>Log out</button>
            </nav>
        </aside>
    );
}

const Home = (loggedIn) => {
    const navigate = useNavigate();
    useEffect(() => {
        if (loggedIn) {
            navigate("/documents");
        }
    }, [loggedIn, navigate])
    
    return (
        <main id = "homeMain">
            <section>
                <h1 className = "cta">Quickly Create & Organize Documents With Module Text Blocks.</h1>
                <h2>A smarter way to build, organize, and refine your documents - flexible, efficient, and intuitive.</h2>
                <NavLink to="/signup" className = "bigButt" style={{ textDecoration: "none", color: 'white' }}>Get Started</NavLink>
            </section>
            <img src="Person_Textblock_IMG.png" alt="Person looking at text blocks with magnifying glass" />
        </main>
    )
}

const About = () => (
    <main>
        <h1>About Us</h1>
    </main>
);

const HowItWorks = () => (
    <main>
        <h1>How It Works</h1>
    </main>
);

const FAQs = () => (
    <main>
        <h1>Frequently Asked Questions</h1>
    </main>
);

const FormItem = ({ ...props }) => (
    <>
        <p><label htmlFor={props.name}>{props.label}</label></p>
        <input
            type={props.type}
            name={props.name}
            id={props.id}
            maxLength={props.maxLength}
            minLength={props.minLength}
            value={props.value}
            required={props.required}
            onChange={props.onChange}>
        </input>
    </>
);

const Login = (setLoggedIn, setUserID) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("")
    const [loginSuccess, setLoginSuccess] = useState(null);
    const navigate = useNavigate();
    async function handleLogin(event) {
        event.preventDefault();
        let response = await fetch("http://137.112.104.54:22051/users/login", {
            method: "POST",
            body: JSON.stringify({ username: username, password: password })
        });
        let responseJson = await response.json();
        setLoginSuccess(responseJson.success);

        if (responseJson.success) {
            setUserID(responseJson.id);
            setLoggedIn(true);
            navigate("/documents");
        }
    }
    return (
        <main id = "loginMain">
            <h1 className = "header">Welcome Back</h1>
            <img src="Person_Document_IMG.png" alt="Person sitting infront of document with a laptop." />
            {loginSuccess === false && <p style={{ color: 'red' }}>Username or Password is incorrect. Please try again.</p>}
            <form id = "login">
                <div className='userInput'>
                    <label>Username</label>
                    <FormItem type='text' name='username' id='username' required
                        onChange={(e) => setUsername(e.target.value)} /> 
                </div>
                <div className='userInput'>
                    <label>Password</label>
                    <FormItem type='password' name='password' id='password' required
                        onChange={(e) => setPassword(e.target.value)} />
                    <br />
                </div>
                <button type='submit' onClick={handleLogin} className='bigButt' id="loginPageButton">Log In</button>
            </form>
            <p>Don't already have an account? <NavLink to="/signup">Sign up</NavLink></p>
        </main>
    );
};

const Signup = (setLoggedIn, setUserID) => {
    const [username, setUsername] = useState("");
    const passwordRef = useRef("");
    const [email, setEmail] = useState("");
    const [passwordValid, setPasswordValid] = useState(null);
    const [isUnique, setIsUnique] = useState(null);
    const navigate = useNavigate();
    const pwRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-+={}[\]:;"'<,>.?/])[A-Za-z\d!@#$%^&*()\-+={}[\]:;"'<,>.?/~]{8,}$/; // oh god

    function checkPassword() {
        let valid = pwRe.test(passwordRef.current);
        setPasswordValid(valid);
    }

    async function clickHandler(event) {
        event.preventDefault();
        try {
            let response = await fetch("http://137.112.104.54:22051/users/new", {
                method: "POST",
                body: JSON.stringify({ username: username, password: passwordRef.current, email: email })
            });

            if (response.ok) {
                let responseJson = await response.json();
                setUserID(responseJson.id);
                setLoggedIn(true);
                navigate("/documents");
            } else {
                console.log("ERROR: Sign up failed!")
            }
        } catch (error) {
            console.log("ERROR: " + error.message);
        }

    }

    useEffect(() => {
        if (username) {
            var checkUsername = async () => {
                try {
                    let response = await fetch(`http://137.112.104.54:22051/users/check?username=${username}`);
                    let data = await response.json();
                    setIsUnique(data.available);
                } catch {
                    console.log("Error checking username");
                }
            }
        }
        let timerId = setTimeout(checkUsername, 200);
        return () => clearTimeout(timerId);
    }, [username]);

    return (
        <main id='signupMain'>
            <section id = "signup">
                <h1 className='header'>Welcome to the Text Block Community</h1>
                <form method='POST' action='http://137.112.104.54:22051/users/new' >
                    <div className='userInput'>
                    <FormItem type='email' name='email' id='email' label='Email' required
                        onChange={(e) => setEmail(e.target.value)} /> 
                    </div>
                    <div className='userInput'>
                        <FormItem type='text' name='username' id='username' label='Username' minLength='3' maxLength='20' required
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setIsUnique(null);
                        }} />
                        {isUnique === false && <p style={{ color: 'red' }}>Username is already taken.</p>}
                        {isUnique && <p style={{ color: 'green' }}>Username is available!</p>}
                    </div>
                    <div className='userInput'>
                        <FormItem type='password' name='password' id='password' label='Password' minLength='8' required
                            onChange={(e) => {
                                passwordRef.current = e.target.value;
                                checkPassword();
                            }} />
                            <ul id = "passReq">
                                <li>One Uppercase Letter</li>
                                <li>One Lowercase Letter</li>
                                <li>One Number</li>
                                <li>One Special Character</li>
                                <li>Minimum Eight Characters</li>

                            </ul>
                    </div>
                    {passwordValid === false && <p style={{ color: 'red' }}>Invalid password.</p>}
                    <br />
                    <button 
                        type='submit'
                        disabled={!isUnique || !passwordValid}
                        onClick={clickHandler} className='bigButt'>Create Account</button>
                </form>
                <p>Already have an account? <NavLink to="/login">Log in</NavLink></p>
            </section>
            <img src="People_Document_IMG.png" alt="People infront of document with a laptop and pencil." />

        </main>
    );
}

const Documents = (userID, docID, setDocID) => {
    const navigate = useNavigate();
    const [documentList, setDocumentList] = useState([]);
    const [docData, setDocData] = useState([]);
    
    async function createDocument() {
        let response = await fetch(`http://137.112.104.54:22051/documents`, {
            method: "POST",
            body: JSON.stringify({id: userID})
        });
        let responseJson = await response.json();
        getDocuments();
        setDocID(responseJson.newid);
        navigate("/documents/edit");
    }

    async function deleteDocument(docID) {
        await fetch(`http://137.112.104.54:22051/documents`, {
            method: "DELETE",
            body: JSON.stringify({id: docID})
        });
        // Removes the document that just got deleted
        // Also causes the document list to re-render
        setDocData(prevData => prevData.filter(doc => doc.id !== docID));
    }

    const getDocuments = useCallback(async () =>  {
        try {
            let response = await fetch(`http://137.112.104.54:22051/documents?id=${userID}`);
            let responseJson = await response.json();
            let newDocs = [];
            for (let doc of responseJson) {
                newDocs.push({
                    id: doc[1],
                    title: doc[2],
                    created: doc[3],
                    updated: doc[4]
                });
            }
            setDocData(prevData => {
                let filteredDocs = newDocs.filter(doc => !prevData.some(existingDoc => existingDoc.id === doc.id));
                if (filteredDocs.length > 0) return [...prevData, ...filteredDocs];
                else return [...prevData];
            });
        } catch (e) {
            console.log("Error getting documents: " + e.message);
        }
    }, [userID]);

    useEffect(() => {
        setDocumentList(() => 
            docData.map(doc => 
                <li key={doc.id}><a href='documents/edit' onClick={(e) => {
                    e.preventDefault();
                    setDocID(doc.id);
                    navigate("/documents/edit");
                }}>{doc.title}: {doc.created}</a>
                <span onClick={(e) => {
                    e.preventDefault();
                    deleteDocument(doc.id);
                }}>&nbsp;&nbsp;&nbsp;x</span></li>
            )
        );
    }, [docData, setDocID, navigate]);

    useEffect(() => {
        let loggedIn = window.localStorage.getItem("loggedIn");
        if (docID) {
            // Reset doc ID if there was one before (should hopefully prevent errors in the future)
            setDocID(null);
        }
        if (!loggedIn) {
            navigate("/login");
        } else {
            getDocuments();
        }
    }, [navigate, getDocuments, docID, setDocID]);

    return  (
        <main id = "docMain">
            <h1>Documents</h1>
            <ul>{documentList}</ul>
            <button onClick={createDocument}>Create new document</button>
        </main>
    );
}

const TextBlocks = (userID, blockID, setBlockID) => {
    const navigate = useNavigate();
    const [blockList, setBlockList] = useState([]);
    const [blockData, setBlockData] = useState([]);

    async function createBlock() {
        let response = await fetch(`http://137.112.104.54:22051/blocks`, {
            method: "POST",
            body: JSON.stringify({userID: userID, docID: null})
        });
        let responseJson = await response.json();
        setBlockID(responseJson.newid);
        getBlocks();
        navigate("/textblocks/edit");
    }

    async function deleteBlock(blockID) {
        console.log("deleting block", blockID);
        await fetch(`http://137.112.104.54:22051/blocks`, {
            method: "DELETE",
            body: JSON.stringify({id: blockID})
        });
        // Filters the text block that was just deleted
        setBlockData(prevData => prevData.filter(block => block.id !== blockID));
    }

    const getBlocks = useCallback(async () =>  {
        try {
            let response = await fetch(`http://137.112.104.54:22051/blocks?id=${userID}`);
            let responseJson = await response.json();
            let newBlocks = [];
            for (let block of responseJson) {
                newBlocks.push({
                    id: block[1],
                    title: block[2],
                    content: block[3],
                    created: block[4],
                    updated: block[5]
                });
            }
            setBlockData(prevData => {
                let filteredBlocks = newBlocks.filter(block => !prevData.some(existingBlock => existingBlock.id === block.id));
                if (filteredBlocks.length > 0) return [...prevData, ...filteredBlocks];
                else return [...prevData];
            });
        } catch (e) {
            console.log("Error getting blocks: " + e.message);
        }
    }, [userID]);

    useEffect(() => {
        setBlockList(() => blockData.map(block =>
            <li key={block.id}>
                <a href='textblocks/edit' onClick={(e) => {
                    e.preventDefault();
                    setBlockID(block.id);
                    navigate("/textblocks/edit");
                }}>{block.title}: {block.created}</a>
                <span onClick={(e) => {
                    e.preventDefault();
                    deleteBlock(block.id);
                }}>&nbsp;&nbsp;&nbsp;x</span>
            </li>
        ));
    }, [blockData, navigate, setBlockID]);

    useEffect(() => {
        let loggedIn = window.localStorage.getItem("loggedIn");
        if (blockID) {
            // Reset block ID if there was one before
            setBlockID(null);
        }
        if (!loggedIn) {
            navigate("/login");
        } else {
            getBlocks();
        }
    }, [navigate, getBlocks, blockID, setBlockID]);

    return (
        <main id="blockMain">
            <h1>Text Blocks</h1>
            <section className='textBoxList'>
            <button onClick={createBlock}>Create New Text Block</button>
            <div>
                <ul>{blockList}</ul>
            </div>
            </section>

        </main>
    );
}

const TextBlock = ({blockID, title, content, setUpdate, inDocEditor}) => {
    // TODO add buttons to move up/down, etc

    async function handleContentChange(event) {
        let newContent = event.value;
        try {
            await fetch("http://137.112.104.54:22051/blocks/content", {
                method: "PUT",
                body: JSON.stringify({
                    id: blockID,
                    content: newContent
                })
            });
        } catch (e) {
            console.log("Error updating block content: " + e.message);
        }
    }

    async function handleTitleChange(event) {
        let newTitle = event.value;
        try {
            await fetch("http://137.112.104.54:22051/blocks/title", {
                method: "PUT",
                body: JSON.stringify({
                    id: blockID,
                    title: newTitle
                })
            });
        } catch (e) {
            console.log("Error updating block title: " + e.message);
        }
    }

    async function handleDeleteBlock(blockID) {
        try {
            let docID = localStorage.getItem("docid")
            await fetch("http://137.112.104.54:22051/documentblocks", {
                method: "DELETE",
                body: JSON.stringify({
                    blockID: blockID,
                    docID: docID
                })
            });
            setUpdate(true);
        } catch (e) {
            console.log("Error deleting block: " + e.message);
        }
    }

    return (
        <>
            <EditText
                className='block-title'
                defaultValue={title}
                onSave={handleTitleChange}
            ></EditText>
            {/* Only render the buttons if the block is in the document editor */}
            {inDocEditor && <span onClick={() => handleDeleteBlock(blockID)}>x</span>}
            <EditTextarea
                className='block-content'
                defaultValue={content}
                onSave={(e) => handleContentChange(e)}
            />
        </>
    );
}

const DocumentEditor = (userID, docID) => {
    const navigate = useNavigate();
    const [blockList, setBlockList] = useState([]);
    const [justDeleted, setJustDeleted] = useState(false);
    const [title, setTitle] = useState("");

    const getBlocks = useCallback(async () => {
        try {
            let response = await fetch(`http://137.112.104.54:22051/documentblocks?docid=${docID}`);
            let responseJson = await response.json();
            // Sorts array by the text block's position (block[4] is position)
            responseJson.sort((a, b) => a[4] - b[4]);
            let blocks = responseJson.map(block => ({
                id: block[1],
                title: block[2],
                content: block[3]
            }
            ));
            setBlockList(blocks);

            response = await fetch(`http://137.112.104.54:22051/documents/title?id=${docID}`);
            responseJson = await response.json();
            setTitle(responseJson);
        } catch (e) {
            console.log("Error fetching blocks: " + e.message);
        }
    }, [docID]);

    const changeTitle = useCallback(async (title) => {
        let response = await fetch(`http://137.112.104.54:22051/documents`, {
            method: "PUT",
            body: JSON.stringify({id: docID, title: title})
        });
        let responseJson = await response.json();
        console.log(responseJson);
    }, [docID]);
    
    async function handleNewTextBlock() {
        try {
            await fetch("http://137.112.104.54:22051/blocks", {
                method: "POST",
                body: JSON.stringify({userID: userID, docID: docID, pos: blockList.length + 1})
            });
            getBlocks();
        } catch (e) {
            console.log("Error creating text block: " + e.message)
        }
    }

    // Source for this function: https://codesandbox.io/p/sandbox/k260nyxq9v?file=%2Findex.js%3A67%2C1
    function reorder(list, startIndex, endIndex) {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        setBlockList(prevList => result);
    };

    // Source: https://codesandbox.io/p/sandbox/k260nyxq9v?file=%2Findex.js%3A49%2C4
    function onDragEnd(result) {
        if (!result.destination) {
            return;
        }
        reorder(blockList, result.source.index, result.destination.index);
    }

    useEffect(() => {
        let loggedIn = window.localStorage.getItem("loggedIn");
        if (!loggedIn) {
            navigate("/login");
        } else {
            getBlocks();
        }
    }, [navigate, getBlocks]);

    useEffect(() => {
        async function update() {
            let data = blockList.map((obj, index) => {
                return {
                    id: obj.id,
                    position: index + 1
                }
            });
            try {
                await fetch("http://137.112.104.54:22051/documentblocks", {
                    method: "PUT",
                    body: JSON.stringify(data)
                });
            } catch (e) {
                console.log("Error saving blocks order: " + e.message);
            }
        }
        if (blockList.length > 0) {
            update();
        }
        if (justDeleted) {
            getBlocks();
            setJustDeleted(false);
        }
    }, [blockList, justDeleted, getBlocks]);

    return (
        <section id="documentEdit">
            <DragDropContext onDragEnd={onDragEnd}>
                <h1>Document Editor</h1>
                <h2><EditText defaultValue={title} onSave={(e) => changeTitle(e.value)} /></h2>
                <Droppable droppableId='document-container'>
                {(provided, snapshot) => (
                    <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    // style={{ backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey' }}
                    >
                        {blockList.map((block, index) => (
                            <Draggable
                                key={block.id}
                                draggableId={`block-${block.id}`}
                                index={index}
                            >
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                >
                                    <TextBlock
                                        blockID={block.id}
                                        title={block.title}
                                        content={block.content}
                                        setUpdate={setJustDeleted}
                                        inDocEditor={true}
                                    />
                                </div>
                            )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
                </Droppable>
                <button onClick={handleNewTextBlock}>Create New Text Block</button>
            </DragDropContext>
        </section>
    );
}

const BlockEditor = (blockID) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const getBlock = useCallback(async () => {
        try {
            let response = await fetch(`http://137.112.104.54:22051/blocks/one?blockID=${blockID}`);
            let responseJson = await response.json();
            setTitle(responseJson[0]);
            setContent(responseJson[1]);
        } catch (e) {
            console.log("Error getting text block: " + e.message);
        }
    }, [blockID]);

    useEffect(() => {
        let loggedIn = window.localStorage.getItem("loggedIn");
        if (!loggedIn) {
            navigate("/login");
        } else {
            getBlock();
        }
    }, [navigate, getBlock]);

    return (
        <section id="blockEdit">
            <h1>Text Block Editor</h1>
            <TextBlock 
                blockID={blockID}
                title={title}
                content={content}
                inDocEditor={false}/>
        </section>
    );
}


export default App;