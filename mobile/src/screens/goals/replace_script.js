const fs = require("fs");
const file = "/Users/chizanumidemili/Projects/ease/mobile/src/screens/goals/GoalWizardScreen.tsx";
let code = fs.readFileSync(file, "utf8");

code = code.replace(
    /const \[slideAnim\] = useState\(new Animated\.Value\(0\)\);/g,
    `const scrollViewRef = React.useRef<any>(null);`
);

code = code.replace(
    /const \[stepAnim\] = useState\(new Animated\.Value\(1\)\);\n/g,
    ""
);

const animateReplacement = `    const animateStepChange = (newStep: Step) => {
        const steps: Step[] = ["CATEGORY", "DEFINITION", "COMMITMENT", "REVIEW"];
        const newIndex = steps.indexOf(newStep);
        if (newIndex >= 0) {
            setStep(newStep);
            scrollViewRef.current?.scrollTo({ x: newIndex * width, animated: true });
        }
    };`;

code = code.replace(
    /const animateStepChange = \(newStep: Step\) => \{[\s\S]*?\}\)\.start\(\);\n        \}\);\n    \};/g,
    animateReplacement
);

code = code.replace(
    /    if \(step === 'GENERATING'\) \{[\s\S]*?\}\n/g,
    ""
);

const scrollViewStartReplace = `                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        pagingEnabled
                        scrollEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        style={styles.scrollView}
                    >`;
code = code.replace(
    /<Animated\.ScrollView\n[\s\S]*?showsVerticalScrollIndicator=\{false\}\n\s*>/g,
    scrollViewStartReplace
);

code = code.replace(/<\/Animated\.ScrollView>/g, "</ScrollView>");

code = code.replace(
    /\{step === 'CATEGORY' && \(\s*<>\s*/g,
    `<ScrollView style={{ width }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>\n`
);
code = code.replace(
    /\{renderFooterActions\(\)\}\n\s*<\/>\n\s*\)\}/g,
    `{renderFooterActions()}\n                        </ScrollView>`
);

code = code.replace(
    /\{step === 'DEFINITION' && \(\s*/g,
    `<ScrollView style={{ width }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>\n`
);
code = code.replace(
    /\{renderFooterActions\(\)\}\n\s*<\/View>\n\s*\)\}/g,
    `{renderFooterActions()}\n                            </View>\n                        </ScrollView>`
);

code = code.replace(
    /\{step === 'COMMITMENT' && \(\s*/g,
    `<ScrollView style={{ width }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>\n`
);
code = code.replace(
    /\{renderFooterActions\(\)\}\n\s*<\/View>\n\s*\)\}\n\n\s*\{step === 'REVIEW'/g,
    `{renderFooterActions()}\n                            </View>\n                        </ScrollView>\n\n                        {step === 'REVIEW'`
);

code = code.replace(
    /\{step === 'REVIEW' && \(\s*/g,
    `<ScrollView style={{ width }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>\n`
);
code = code.replace(
    /\{renderFooterActions\(\)\}\n\s*<\/View>\n\s*\)\}/g,
    `{renderFooterActions()}\n                            </View>\n                        </ScrollView>`
);

code = code.replace(
    /source=\{require\('\.\.\/\.\.\/\.\.\/assets\/images\/wizard_bg\.png'\)\}/,
    `source={formData.category ? CATEGORIES.find(c => c.id === formData.category)?.bgImage : require('../../../assets/images/wizard_bg.png')}`
);

fs.writeFileSync(file, code);
