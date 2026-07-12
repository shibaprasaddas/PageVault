const EXTRACTION_RULES = {

    german: [

        // Specific English phrases
        /optionally german language/i,
        /german language is mandatory/i,
        /german language required/i,
        /fluent german required/i,
        /business fluent german/i,
        /native german/i,

        // Levels
        /deutsch\s*\(c2\)/i,
        /deutsch\s*\(c1\)/i,
        /deutsch\s*\(b2\)/i,
        /deutsch\s*\(b1\)/i,
        /c2 deutsch/i,
        /c1 deutsch/i,
        /b2 deutsch/i,
        /b1 deutsch/i,

        // German phrases
        /verhandlungssichere deutschkenntnisse/i,
        /fließende deutschkenntnisse/i,
        /sehr gute deutschkenntnisse/i,
        /gute deutschkenntnisse/i,
        /deutschkenntnisse von vorteil/i,
        /deutsch in wort und schrift/i,
        /deutschkenntnisse/i,

        // Generic fallback
        /fluent german/i,
        /german language/i,
        /german skills/i,
        /german/i

    ]

};