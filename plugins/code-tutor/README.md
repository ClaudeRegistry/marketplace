# Code Tutor

AI-powered code learning and mentoring system for Claude Code that helps developers learn through interactive teaching, guided practice, and constructive feedback.

## Purpose

Code Tutor transforms Claude Code into your personal programming teacher, providing:
- **Interactive Learning**: Socratic teaching method that helps you discover solutions
- **Adaptive Education**: Adjusts to your skill level from beginner to advanced
- **Contextual Teaching**: Uses examples from your actual codebase
- **Hands-On Practice**: Generates personalized coding exercises
- **Constructive Feedback**: Educational code reviews that teach, not criticize
- **Deep Understanding**: Comprehensive concept explanations with real-world applications

## Why Code Tutor?

**Common Developer Challenges:**
- "I want to understand this code pattern, not just copy-paste it"
- "How do I get better at coding through my daily work?"
- "I need to learn this new framework but don't know where to start"
- "Code reviews just tell me what's wrong, not why or how to improve"
- "I learn better through conversation and practice"

**Code Tutor Makes It Easy:**
- Learn by doing with exercises tailored to your codebase
- Understand concepts deeply through layered explanations
- Get constructive feedback that builds confidence
- Practice new skills in a safe, supportive environment
- Bridge the gap between tutorials and real-world coding

## What Makes Code Tutor Unique

### The Code Tutor Skill: Your Persistent Teaching Companion

Unlike commands that give one-off answers, the **Code Tutor skill** provides an ongoing teaching relationship:

- **Remembers Context**: Maintains conversation history to build on previous learning
- **Adapts Teaching Style**: Adjusts complexity based on your responses
- **Socratic Method**: Asks guiding questions instead of just giving answers
- **Growth Focused**: Frames mistakes as learning opportunities
- **Personalized**: Learns your skill level and tailors explanations accordingly

**Example interaction**:
```
You: "I don't understand closures"

Code Tutor: "Great topic! Let me start with a question: Have you worked with
functions that return other functions before? Even if you haven't, that's
totally fine - we'll build up to it together."

[Adapts based on your response, guides discovery through questions]
```

### Supporting Commands: Focused Learning Tools

Four specialized commands complement the skill for specific learning tasks:

1. **`/explain-code`** - Break down complex code into understandable explanations
2. **`/practice-exercise`** - Generate personalized coding exercises
3. **`/code-review-teach`** - Educational code reviews with constructive feedback
4. **`/concept-deep-dive`** - Comprehensive exploration of programming concepts

## Features

### 🎓 Interactive Teaching Skill

The core `code-mentor` skill provides:

#### Socratic Teaching Method
- Guides you to discover solutions through questions
- Encourages critical thinking and problem-solving
- Builds understanding rather than memorization
- Creates "aha!" moments through guided discovery

#### Adaptive Learning
- Assesses your skill level through conversation
- Adjusts explanation complexity dynamically (beginner/intermediate/advanced)
- Provides multiple explanations if needed
- Builds progressively on your knowledge

#### Multiple Teaching Modes
- **Exploratory Learning**: Understand existing code together
- **Concept Deep-Dive**: Master specific concepts layer by layer
- **Debugging Coach**: Learn problem-solving strategies, not just fixes
- **Code Review Teacher**: Improve through constructive feedback
- **Practice & Exercises**: Build skills through hands-on challenges

#### Contextual Education
- Uses examples from your actual codebase
- Connects theory to your real work
- Makes abstract concepts concrete
- Grounds learning in practical application

#### Growth Mindset Approach
- Celebrates progress and effort
- Frames mistakes as learning opportunities
- Builds confidence while maintaining accuracy
- Encourages experimentation and curiosity

### 📚 Four Specialized Commands

#### `/explain-code`
Break down complex code into clear, multi-layered explanations.

**What it does**:
- Explains code at different depth levels (what, how, why)
- Identifies patterns and concepts used
- Discusses design decisions and trade-offs
- Points out common pitfalls and best practices
- Adapts complexity to your skill level

**Example usage**:
```
/explain-code src/middleware/auth.js
→ Get layered explanation from high-level purpose to implementation details

/explain-code (with code selection)
→ Explain selected code snippet with context
```

**Perfect for**:
- Understanding unfamiliar code
- Learning new patterns and techniques
- Onboarding to a new codebase
- Deepening knowledge of existing code

#### `/practice-exercise`
Generate personalized coding exercises based on your codebase and skill level.

**What it does**:
- Creates exercises relevant to your actual work
- Provides clear learning objectives
- Offers progressive hints when needed
- Reviews solutions constructively
- Builds exercises that matter to your projects

**Example usage**:
```
/practice-exercise
→ "I'd like to practice async/await"
→ Generates exercise with requirements, tests, and hints

/practice-exercise
→ "Create an exercise based on patterns in my codebase"
→ Analyzes your code and creates relevant practice
```

**Exercise types**:
- Implementation (build from scratch)
- Bug fixing (diagnose and fix)
- Refactoring (improve existing code)
- Design (architectural thinking)
- Testing (write comprehensive tests)
- Performance (optimization challenges)

**Perfect for**:
- Reinforcing new concepts
- Practicing before implementing
- Skill building through repetition
- Preparing for real-world tasks

#### `/code-review-teach`
Educational code review that teaches while reviewing.

**What it does**:
- Provides constructive, encouraging feedback
- Explains why changes are suggested, not just what
- Categorizes feedback by importance (critical/important/suggestion)
- Celebrates what's done well
- Discusses alternatives and trade-offs
- Connects to broader concepts and patterns

**Example usage**:
```
/code-review-teach src/components/UserProfile.tsx
→ Get comprehensive educational review

/code-review-teach (with code selection)
→ Review specific code with teaching focus
```

**Review dimensions**:
- Correctness and bugs
- Security considerations
- Performance implications
- Code quality and maintainability
- Test coverage
- Best practices and patterns

**Perfect for**:
- Learning from your own code
- Improving coding skills
- Understanding best practices
- Building confidence
- Pre-merge learning reviews

#### `/concept-deep-dive`
Comprehensive exploration of programming concepts with examples from your codebase.

**What it does**:
- Provides layered explanations (simple to advanced)
- Uses analogies and mental models
- Shows real examples from your code
- Explains practical applications
- Warns about common pitfalls
- Connects to related concepts
- Includes interactive practice

**Example usage**:
```
/concept-deep-dive closures
→ Deep explanation from ELI5 to advanced, with your codebase examples

/concept-deep-dive async/await
→ Comprehensive guide with mechanics, use cases, pitfalls
```

**Concept categories**:
- Language features (closures, promises, prototypes)
- Design patterns (singleton, factory, observer)
- Architectural concepts (DI, IoC, SOLID)
- Programming paradigms (FP, OOP, reactive)
- Web concepts (REST, auth, CORS)
- Performance & optimization
- Testing concepts

**Perfect for**:
- Mastering fundamental concepts
- Understanding advanced topics
- Connecting theory to practice
- Building mental models
- Going from "using" to "understanding"

## Installation

First, add the Claude Registry marketplace (if you haven't already):

```bash
/plugin marketplace add clauderegistry/marketplace
```

Then install Code Tutor:

```bash
/plugin install code-tutor
```

Or use the interactive browser:

```bash
/plugin
```

## Getting Started

### Using the Code Tutor Skill

The Code Tutor skill activates automatically when you engage in teaching-oriented conversations. Simply start asking questions or request learning help naturally:

```
You: "I want to learn about React hooks"

Code Tutor: "Excellent! Hooks are a powerful feature. Before we dive in,
tell me: Have you worked with React class components before, or is this
your first time with React?"

[Interactive learning conversation continues...]
```

The skill stays active throughout your session, remembering context and building on previous explanations.

### Using Individual Commands

Commands work standalone without activating the skill:

```bash
# Explain specific code
/explain-code src/utils/debounce.js

# Generate practice exercise
/practice-exercise
→ "I want to practice promises and error handling"

# Get educational code review
/code-review-teach src/api/auth.ts

# Deep dive into concept
/concept-deep-dive event-loop
```

## Learning Workflows

### Workflow 1: Learning a New Concept

```
1. /concept-deep-dive [concept-name]
   → Get comprehensive explanation with examples

2. /explain-code [file-using-concept]
   → See the concept in action in your codebase

3. /practice-exercise
   → Practice implementing the concept yourself

4. /code-review-teach [your-implementation]
   → Get feedback on your practice implementation
```

**Example**: Learning async/await
```
/concept-deep-dive async/await
/explain-code src/api/client.js
/practice-exercise → "async/await with error handling"
/code-review-teach src/services/user-service.js
```

### Workflow 2: Understanding Existing Code

```
1. /explain-code [confusing-file]
   → Get explanation of what code does

2. /concept-deep-dive [pattern-used]
   → Deep dive into patterns/concepts used

3. Ask follow-up questions naturally
   → The Code Tutor skill will activate for interactive teaching

4. /practice-exercise
   → Practice similar patterns
```

**Example**: Understanding middleware
```
/explain-code src/middleware/auth.js
/concept-deep-dive middleware-pattern
"How would I add rate limiting middleware?" → Code Tutor skill activates
/practice-exercise → "Implement custom middleware"
```

### Workflow 3: Code Review as Learning

```
1. Write your implementation

2. /code-review-teach [your-code]
   → Get educational feedback

3. /concept-deep-dive [concepts-mentioned]
   → Learn about patterns suggested

4. Refactor based on feedback

5. /code-review-teach [refactored-code]
   → Verify improvements
```

### Workflow 4: Skill Building

```
1. Ask: "I want to improve at [skill-area]"
   → Code Tutor skill activates and suggests learning path

2. Follow the suggested learning path

3. /practice-exercise (series)
   → Complete progressive exercises

4. /code-review-teach (your work)
   → Get feedback on real implementations

5. Repeat with increasing difficulty
```

### Workflow 5: Debugging as Learning

```
1. Encounter bug or error

2. Ask: "I have this error: [error message]"
   → Code Tutor skill activates

3. Code Tutor guides debugging process
   → Asks questions, teaches strategy

4. /concept-deep-dive [underlying-concept]
   → Understand root cause

5. /practice-exercise
   → Practice avoiding similar bugs
```

## Real-World Use Cases

### Use Case 1: "Junior Dev Onboarding"

**Problem**: New team member needs to understand the codebase quickly.

**Solution**:
```
Week 1: Code Exploration
- Use /explain-code on key modules
- /concept-deep-dive on main patterns used
- Ask questions naturally for interactive Q&A sessions

Week 2: Hands-On Practice
- /practice-exercise on common tasks
- /code-review-teach on practice implementations
- Build confidence before real tasks

Week 3: Real Work with Support
- /code-review-teach on actual contributions
- Continue asking questions as they arise
- Continuous learning while contributing
```

**Result**: Faster onboarding, deeper understanding, more confident contributors.

---

### Use Case 2: "Learning While Building"

**Problem**: Need to implement feature using unfamiliar technology.

**Solution**:
```
1. /concept-deep-dive [new-technology]
   → "React Context API"
   → Understand fundamentals

2. /explain-code [example-from-codebase]
   → See how team uses it

3. /practice-exercise
   → Practice implementation safely

4. Implement actual feature

5. /code-review-teach [your-feature]
   → Get feedback and improve
```

**Result**: Learn new tech while delivering features, not after.

---

### Use Case 3: "Code Review Education"

**Problem**: Code reviews feel negative, junior devs aren't learning.

**Solution**:
```
Before submitting PR:
1. Self-review with /code-review-teach
2. Address learning points
3. Submit better code

After PR feedback:
1. /concept-deep-dive on patterns suggested
2. /practice-exercise to practice alternatives
3. Apply learning to current and future code
```

**Result**: Code reviews become learning opportunities, not gatekeeping.

---

### Use Case 4: "Level Up Your Skills"

**Problem**: Stuck at current skill level, want to improve.

**Solution**:
```
Daily practice:
- Morning: /concept-deep-dive on advanced topic
- Workday: /explain-code on complex code you encounter
- Practice: /practice-exercise on new patterns
- Review: /code-review-teach on your day's code

Weekly:
- Pick advanced concept
- Deep dive and practice
- Implement in side project
- Review and refine
```

**Result**: Consistent skill growth through deliberate practice.

---

### Use Case 5: "Teaching Others"

**Problem**: Need to teach concepts to teammates.

**Solution**:
```
1. /concept-deep-dive [topic]
   → Get comprehensive explanation

2. Use Code Tutor's teaching structure as template

3. /explain-code on team's codebase examples
   → Ground in familiar context

4. /practice-exercise
   → Create exercises for teammates

5. Share Code Tutor plugin with team
```

**Result**: Better equipped to mentor others, team skill growth.

---

### Use Case 6: "Interview Preparation"

**Problem**: Preparing for technical interviews.

**Solution**:
```
Concept mastery:
- /concept-deep-dive on interview topics
- Closures, promises, algorithms, patterns

Practice:
- /practice-exercise on common interview questions
- Progressive difficulty

Code review:
- /code-review-teach on your solutions
- Learn to explain your thinking
- Understand trade-offs

Mock interviews with Code Tutor:
- Ask: "Can you interview me on [topic]?"
- Practice explaining concepts
- Get feedback on answers
```

**Result**: Deep understanding, not just memorized answers.

## Teaching Philosophy

Code Tutor is built on proven teaching principles:

### 1. Socratic Method
Guides discovery through questions rather than lecturing. Builds critical thinking and problem-solving skills.

### 2. Constructivism
Learners construct knowledge by building on existing understanding. Each explanation connects new to familiar concepts.

### 3. Zone of Proximal Development
Challenges slightly beyond current ability level, with support to bridge the gap. Not too easy (boring) or too hard (frustrating).

### 4. Deliberate Practice
Focused, goal-oriented practice with immediate feedback. Exercises target specific skills for measurable improvement.

### 5. Growth Mindset
Mistakes are learning opportunities, not failures. Emphasizes effort and progress over innate ability.

### 6. Contextual Learning
Grounds abstract concepts in familiar code. Makes learning relevant and immediately applicable.

### 7. Metacognition
Helps you think about your thinking. Builds self-awareness of learning process and problem-solving strategies.

## Skill Level Adaptation

Code Tutor automatically adapts to your level:

### Beginner Developers
**Approach**:
- Simple, non-technical language
- Extensive use of analogies
- Step-by-step explanations
- High encouragement and patience
- Focus on fundamentals

**Example**:
```
"Think of a function like a recipe. You give it ingredients (parameters),
it follows steps (the function body), and gives you back a finished dish
(the return value)."
```

### Intermediate Developers
**Approach**:
- Balanced theory and practice
- Introduces design patterns
- Discusses best practices
- Encourages critical thinking
- Explores trade-offs

**Example**:
```
"You're using a for loop here, which works perfectly. Have you considered
using map() instead? Let's explore when each approach is more appropriate
and the trade-offs involved..."
```

### Advanced Developers
**Approach**:
- Deep technical discussions
- Performance implications
- Edge cases and failure modes
- Architectural considerations
- Industry best practices

**Example**:
```
"Interesting use of the singleton pattern here. Let's discuss implications
for testability and potential issues in concurrent environments. What led
you to choose this over dependency injection?"
```

## Learning Styles Supported

### Visual Learners
- Text-based diagrams and visualizations
- Code structure breakdowns
- Execution flow illustrations
- Mental model graphics

### Reading/Writing Learners
- Detailed written explanations
- Code examples with comments
- Documentation and resources
- Practice exercises

### Kinesthetic Learners
- Hands-on coding exercises
- Interactive debugging
- Refactoring challenges
- Real codebase examples

### Auditory Learners
- Conversational teaching style
- Dialogue-based learning
- "Talk through" explanations
- Question and answer format

## Tips for Effective Learning

### 1. Be Specific About Your Goals
```
❌ "Teach me JavaScript"
✅ "I want to understand closures and where they're useful"
```

### 2. Ask Follow-Up Questions
Don't hesitate to say:
- "I don't understand this part"
- "Can you explain that differently?"
- "Can you show an example from my codebase?"

### 3. Practice Immediately
After learning a concept, use `/practice-exercise` to reinforce it while fresh.

### 4. Review Your Own Code
Use `/code-review-teach` on code you've written to learn from your own work.

### 5. Embrace Mistakes
Mistakes in exercises and practice are learning opportunities, not failures.

### 6. Build on Previous Learning
Code Tutor skill remembers context - reference earlier topics in the conversation.

### 7. Connect to Real Work
Always ask "How does this apply to my current project?"

### 8. Teach to Learn
After learning something, explain it back to Code Tutor. Teaching reinforces learning.

## Commands vs Skill: When to Use Each

### Use the **Code Tutor Skill** when you want:
- ✅ Ongoing conversation with context
- ✅ Interactive Q&A and exploration
- ✅ Adaptive teaching that responds to your answers
- ✅ Socratic guidance through discovery
- ✅ Session-long learning relationship

**Example scenarios**:
- Learning a new concept through dialogue
- Debugging with guided questions
- Exploratory learning in a new codebase
- Practice sessions with back-and-forth feedback

### Use **Commands** when you want:
- ✅ Quick, focused explanations
- ✅ Standalone exercises or reviews
- ✅ One-off concept deep dives
- ✅ Specific code explanations
- ✅ Structured output

**Example scenarios**:
- Quickly explain this function
- Generate an exercise on this topic
- Review this file before committing
- Get comprehensive guide to this concept

### Best of Both: Combine Them
```
Start with command for structure:
/concept-deep-dive promises

Then ask follow-up questions naturally:
"I have questions about promise chaining from that deep dive..."
→ Code Tutor skill continues the conversation
```

## Plugin Structure

```
code-tutor/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── skills/
│   └── code-mentor.md           # Interactive teaching skill
├── commands/
│   ├── explain-code.md          # Code explanation command
│   ├── practice-exercise.md     # Exercise generation command
│   ├── code-review-teach.md     # Educational review command
│   └── concept-deep-dive.md     # Concept exploration command
└── README.md                     # This file
```

## Requirements

- Claude Code CLI installed
- Claude Code version compatible with plugins and skills features

## Managing the Plugin

To disable the plugin temporarily:
```bash
/plugin disable code-tutor
```

To enable it again:
```bash
/plugin enable code-tutor
```

To uninstall completely:
```bash
/plugin uninstall code-tutor
```

## FAQ

### "How is this different from just asking Claude Code questions?"

Code Tutor is specifically designed for teaching:
- Uses proven pedagogical techniques (Socratic method, progressive learning)
- Adapts to your skill level automatically
- Provides structured learning paths
- Generates contextual practice exercises
- Frames feedback constructively for learning
- Builds on conversation context in skill mode

Regular Claude Code is great for getting answers. Code Tutor is optimized for building understanding.

### "Do I need to use the skill, or can I just use commands?"

Both work! Commands are great for quick, focused learning. The skill provides deeper, interactive teaching. Use what fits your learning style and needs.

### "Can Code Tutor help with languages other than JavaScript?"

Yes! While examples often use JavaScript, the teaching principles and concepts apply across languages. Code Tutor adapts to whatever language your codebase uses.

### "Is Code Tutor suitable for beginners?"

Absolutely! Code Tutor automatically detects and adapts to your skill level. It provides extra support, simpler explanations, and more encouragement for beginners.

### "How does Code Tutor assess my skill level?"

Through conversation and context:
- Questions you ask
- Code you write
- Responses to teaching
- Files you work with
- Terminology you use

It adapts dynamically throughout the session.

### "Can I use Code Tutor for interview prep?"

Yes! Use it to:
- Deep dive into common interview topics
- Practice coding challenges
- Learn to explain your thinking
- Understand trade-offs and alternatives
- Build confidence through practice

### "Will Code Tutor write code for me?"

Code Tutor is a teacher, not a code generator. It will:
- ✅ Explain code and concepts
- ✅ Guide you to solutions through questions
- ✅ Provide examples and patterns
- ✅ Review and improve your code

It won't just give you the answer - it helps you learn to solve problems yourself.

### "How do I get the most out of Code Tutor?"

1. Be specific about learning goals
2. Practice with generated exercises
3. Ask follow-up questions when confused
4. Apply learning immediately to your code
5. Review your own code for feedback
6. Don't be afraid to say you don't understand
7. Embrace mistakes as learning opportunities

## Contributing

Contributions are welcome! To improve Code Tutor:

1. Fork the repository
2. Create a feature branch
3. Make your changes to skill or command files
4. Test with various learning scenarios
5. Submit a pull request

### Ideas for Contributions:
- Add more teaching strategies
- Expand concept deep-dive library
- Improve exercise generation templates
- Add more code review dimensions
- Enhance skill-level adaptation
- Create learning path recommendations
- Add visual learning aids
- Improve accessibility features

## License

MIT

## Version

1.0.0

## Acknowledgments

Built on educational psychology principles:
- **Socratic Method** - Teaching through guided questions
- **Constructivism** - Building on existing knowledge
- **Zone of Proximal Development** (Vygotsky) - Optimal challenge level
- **Deliberate Practice** (Ericsson) - Focused skill building
- **Growth Mindset** (Dweck) - Learning from mistakes

Inspired by great teachers and mentors who:
- Explain the "why" not just the "what"
- Make complex ideas accessible
- Build confidence through encouragement
- Foster independent learning
- Celebrate curiosity and effort

Built for developers who want to truly understand their craft, not just copy-paste solutions.

---

**Transform your coding from cargo-cult programming to deep understanding.**

Made with care for the Claude Code community 🎓

## Getting Help

- **Plugin Issues**: Report at the marketplace GitHub repository
- **Learning Questions**: Just ask naturally - Code Tutor is designed for this!
- **Feature Requests**: Submit via pull request or issue
- **Feedback**: We'd love to hear how Code Tutor has helped your learning journey

---

**Happy Learning!** 🚀
