import React, { useEffect, useRef, useState } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/material.css"; // Additional themes
import "codemirror/theme/eclipse.css";
import "codemirror/mode/clike/clike"; // For C, C++, Java
import "codemirror/mode/javascript/javascript"; // For JavaScript
import "codemirror/mode/python/python"; // For Python
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import Axios from "axios";
import { initSocket } from "../socket";
import ACTIONS from "../Actions.js";
import Navbar from "./Navbar";
import toast from "react-hot-toast";

const apiKey = "d3e4ee7a9emsha45d05810b4c0f8p1cbe4ejsncb947d65b3e2";
const appURL = "https://judge0-ce.p.rapidapi.com/submissions";

const Editor = ({ roomId, username }) => {
    const [userCode, setUserCode] = useState("// Write your code here...");
    const [userLanguage, setUserLanguage] = useState("javascript");
    const [userTheme, setUserTheme] = useState("dracula");
    const [fontSize, setFontSize] = useState(16);
    const [userInput, setUserInput] = useState("");
    const [userOutput, setUserOutput] = useState("");
    const [loading, setLoading] = useState(false);
    const editorRef = useRef(null);
    const textareaRef = useRef(null);
    const socketRef = useRef(null);

    // Initialize Socket.IO connection
    useEffect(() => {
        const setupSocket = async () => {
            socketRef.current = await initSocket();
            socketRef.current.emit(ACTIONS.JOIN, { roomId, username });

            // Listen for new users joining the room
            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                if (username !== undefined) {
                    toast.success(`${username} joined the room.`);
                }
            });

            // Listen for code changes
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (editorRef.current && editorRef.current.getValue() !== code) {
                    editorRef.current.setValue(code);
                }
            });

            return () => {
                socketRef.current.disconnect();
            };
        };

        setupSocket();
    }, [roomId, username]);

    // Initialize CodeMirror editor
    useEffect(() => {
        if (!editorRef.current) {
            editorRef.current = Codemirror.fromTextArea(textareaRef.current, {
                mode: getCodeMirrorMode(userLanguage),
                theme: userTheme,
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            });

            editorRef.current.setSize("100%", "300px");

            editorRef.current.on("change", (instance) => {
                const code = instance.getValue();
                handleCodeChange(code);
            });
        } else {
            editorRef.current.setOption("mode", getCodeMirrorMode(userLanguage));
            editorRef.current.setOption("theme", userTheme);
        }
    }, [userLanguage, userTheme]);

    // Adjust font size
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.getWrapperElement().style.fontSize = `${fontSize}px`;
            editorRef.current.refresh();
        }
    }, [fontSize]);

    const handleCodeChange = (code) => {
        setUserCode(code);
        socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
    };

    const getCodeMirrorMode = (language) => {
        const modes = {
            javascript: "javascript",
            python: "python",
            c: "text/x-csrc",
            cpp: "text/x-c++src",
            java: "text/x-java",
        };
        return modes[language] || "javascript";
    };

    const Compile = () => {
        setLoading(true);

        const languageMapping = {
            java: 62,
            c: 50,
            cpp: 54,
            python: 71,
            javascript: 63,
        };

        const languageId = languageMapping[userLanguage];
        const formData = {
            language_id: languageId,
            source_code: btoa(userCode),
            stdin: btoa(userInput),
        };

        Axios.post(
            appURL,
            {
                base64_encoded: "true",
                fields: "*",
                ...formData,
            },
            {
                headers: {
                    "content-type": "application/json",
                    "X-RapidAPI-Key": apiKey,
                    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                },
            }
        )
            .then(({ data }) => checkStatus(data.token))
            .catch((err) => {
                console.error("Compilation error:", err);
                setLoading(false);
            });
    };

    const checkStatus = async (token) => {
        try {
            const { data } = await Axios.get(`${appURL}/${token}`, {
                params: { base64_encoded: "true", fields: "*" },
                headers: {
                    "X-RapidAPI-Key": apiKey,
                    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                },
            });

            if (data.status?.id === 1 || data.status?.id === 2) {
                setTimeout(() => checkStatus(token), 2000);
            } else {
                setLoading(false);
                if (data.compile_output) {
                    setUserOutput(atob(data.compile_output));
                } else if (data.stderr) {
                    setUserOutput(atob(data.stderr));
                } else {
                    setUserOutput(atob(data.stdout));
                }
            }
        } catch (err) {
            console.error("Error checking status:", err);
            setLoading(false);
        }
    };

    const clearOutput = () => setUserOutput("");

    return (
        <>
            <Navbar
                userLanguage={userLanguage}
                setUserLanguage={setUserLanguage}
                userTheme={userTheme}
                setUserTheme={setUserTheme}
                fontSize={fontSize}
                setFontSize={setFontSize}
            />
            <div className="main">
                <div className="left-container">
                    <div className="editor-container">
                        <textarea ref={textareaRef} defaultValue={userCode}></textarea>
                    </div>
                    <button className="run-btn" onClick={Compile}>
                        {loading ? "Compiling..." : "Run"}
                    </button>
                </div>
                <div className="right-container">
                    <div className="input-box">
                        <h4>Input:</h4>
                        <textarea
                            id="code-input"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="output-box">
                        <h4>Output:</h4>
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            <pre>{userOutput}</pre>
                        )}
                        <button onClick={clearOutput} className="clear-btn">
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Editor;
