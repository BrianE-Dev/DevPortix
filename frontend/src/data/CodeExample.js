export const codeExamples = {
    "App.jsx" : `
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
    "Hero.jsx" : `
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
    "Navbar.jsx" : `
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
        bgColor: "bg-blue-500/20",
        iconColor: "text-blue-400",
        textColor: "text-blue-200",
        contentColor: "text-blue-300",
        icon: "AI",
        title: "Smart Completion",
        content: "AI-powered code suggestions in realtime",
    },
    "Hero.jsx": {
        bgColor: "bg-purple-500/20",
        iconColor: "text-purple-400",
        textColor: "text-purple-200",
        contentColor: "text-purple-300",
        icon: "⚡",
        title: "Auto Animation",
        content: "Dynamic typing effects generated automatically",
    },
    "Navbar.jsx": {
        bgColor: "bg-purple-500/20",
        iconColor: "text-emerald-400",
        textColor: "text-emerald-200",
        contentColor: "text-emerald-300",
        icon: "🔍",
        title: "Smart search",
        content: "Intelligent code search across your project",
    },
};
