export const codeExamples = {
    "App.jsx": `
    import { useState } from 'react';
    import { DEVPORTIX } from 'devportix'

    // App.jsx
    const App = ()=>{
        const [code, setCode] = useState("");

        const handleAICompletion = async ()=> {
            const suggestion = await DEVPORTIX.complete(code);
            setCode(suggestion);
            };
        
        return (
        <div classname="App">
            <CodeEditor
                onChange={setCode}
                onAI = {handleAICompletion}
            />
        </div>
        );
        }
    `,
    "Hero.jsx": `
    import { useState } from 'react';
    import { DEVPORTIX } from 'devportix'

    // Hero.jsx
    export default const Hero = ()=>{
        const [isTyping, setIsTyping] = useState(false);

        useEffects(()=>{
            const timer =setTimeout(()=> (
                setIsTyping(true);),
                1000);
            return ()=> clearTimeout(timer);
            }, []);
        
        return (
        <div classname="App">
            <CodeEditor
                onChange={setCode}
                onAI = {handleAICompletion}
            />
        </div>
        );
        }
    `,
    "Navbar.jsx": `
    import { useState } from 'react';
    import { DEVPORTIX } from 'devportix'

    // Navbar.jsx
    const Navbar = ()=>{
        const [isOpen, setIsOpen] = useState("");

        const handleSearch = async ()=> {
            const results = await DEVPORTIX.search(searchQuery);
            return results;
            };
        
        return (
        <div classname="App">
            <CodeEditor
                onChange={setCode}
                onAI = {handleAICompletion}
            />
        </div>
        );
        }
    `,
};

export const floatingCards = {
    "App.jsx": {
        accentStyles: {
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.28), rgba(30, 41, 59, 0.78))",
            icon: "#60a5fa",
            title: "#dbeafe",
            content: "#93c5fd",
        },
        icon: "AI",
        title: "Smart Completion",
        content: "AI-powered code suggestions in realtime",
    },
    "Hero.jsx": {
        accentStyles: {
            background: "linear-gradient(135deg, rgba(147, 51, 234, 0.28), rgba(49, 46, 129, 0.78))",
            icon: "#fb923c",
            title: "#f3e8ff",
            content: "#d8b4fe",
        },
        icon: "⚡",
        title: "Auto Animation",
        content: "Dynamic typing effects generated automatically",
    },
    "Navbar.jsx": {
        accentStyles: {
            background: "linear-gradient(135deg, rgba(91, 33, 182, 0.28), rgba(67, 56, 202, 0.78))",
            icon: "#a7f3d0",
            title: "#d1fae5",
            content: "#6ee7b7",
        },
        icon: "🔍",
        title: "Smart search",
        content: "Intelligent code search across your project",
    },
};
