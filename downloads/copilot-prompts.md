# GitHub Copilot Prompt Cheat Sheet — High School Math Teachers
*LIFT LAB Workshop — California Math Project @ CSUDH | March 17, 2026*
*Presented by: Mr. Vishal Tharu*

**What is GitHub Copilot?** An AI coding assistant — but you DON'T need to be a coder to use it.
**GitHub Copilot Chat** works like ChatGPT and is free for educators and students.
**Free for educators:** https://education.github.com/teachers
**Use it at:** https://github.com/copilot (no setup needed)

---

## WHY GITHUB COPILOT FOR MATH TEACHERS?

| Superpower | What It Means for You |
|---|---|
| Generates Python code | Create math visualizations, graphs, and interactive demos — no coding experience needed |
| Jupyter Notebooks | Build step-by-step computational math lessons students can run in their browser |
| Computational accuracy | Unlike ChatGPT/Claude, Copilot RUNS the code — so the math is verified |
| Free for teachers | GitHub Education provides free Copilot access for verified educators |
| Auto-grading scripts | Write simple scripts to check student work |

**Best for:** Teachers who want to create visual, interactive math demonstrations or automated tools — even without coding experience.

---

## HOW TO USE COPILOT CHAT (no coding needed)

1. Go to **github.com/copilot**
2. Sign in with your GitHub account (free)
3. Type your request in plain English — just like ChatGPT
4. Copilot generates code + explanation
5. Click **"Run"** to see it execute live

**You describe what you want. Copilot writes the code. You see the result.**

---

## 1. MATH GRAPH / VISUALIZATION GENERATOR

> "Write Python code using matplotlib to graph [MATH FUNCTION OR CONCEPT]. Label the axes, title the graph '[TITLE]', and add a legend. Make it suitable for a [GRADE] classroom display. Show the code and then explain what each part does in simple terms."

### Examples:

**Linear functions:**
> "Write Python code to graph y = 2x + 3 and y = -x + 5 on the same coordinate plane. Show where they intersect. Label both lines and the intersection point. Title it 'Systems of Equations'. Explain the code simply."

**Quadratic:**
> "Write Python code to graph f(x) = x² - 4x + 3. Mark the vertex and x-intercepts. Use a different color for each feature. Title it 'Quadratic Functions'. Explain what each part of the code does."

**Trigonometry:**
> "Write Python code to graph sin(x) and cos(x) from -2π to 2π on the same graph. Use different colors, label key points (peaks, zeros, intercepts). Title it 'Sine and Cosine Functions'."

**Statistics — histogram:**
> "Write Python code to create a histogram showing a simulated set of 30 student test scores (normally distributed, mean 75, standard deviation 10). Add a vertical line for the mean. Label axes. Title it 'Class Score Distribution'."

---

## 2. INTERACTIVE MATH TOOL CREATOR

> "Write Python code for a simple [TOOL TYPE] for [GRADE] math students. It should [DESCRIBE BEHAVIOR]. Keep it simple enough that a math teacher with no coding experience could run it."

### Examples:

**Equation solver:**
> "Write Python code for a simple command-line tool where a student types in a linear equation like '2x + 5 = 11' and the program shows the step-by-step solution. Keep the code simple and well-commented."

**Quiz generator:**
> "Write Python code that generates 10 random [TOPIC — e.g., 'two-step equation'] problems for a 9th grader, asks the student to type in answers, and then shows which ones are right or wrong with the correct solution. Use only integer answers."

**Times table practice:**
> "Write Python code for a multiplication table quiz that picks random multiplication problems (1-12 × 1-12), accepts student input, tracks score, and gives a final result. Keep it beginner-friendly."

---

## 3. AUTOMATED ANSWER CHECKER

> "Write Python code that takes a list of [MATH TOPIC] problems and a list of student answers, compares them to the correct answers, and outputs a score and which problems the student got wrong. Here are the problems and correct answers: [PASTE YOUR PROBLEMS AND ANSWERS]"

---

## 4. DATA ANALYSIS FOR STATISTICS CLASS

> "Write Python code to [STATISTICAL TASK] using this dataset: [PASTE DATA OR DESCRIBE IT]. Show the calculation step by step and output: the result, a brief interpretation in plain English, and a visualization if appropriate."

### Examples:

**Descriptive statistics:**
> "Write Python code to calculate mean, median, mode, and standard deviation for this dataset: [85, 90, 72, 88, 91, 65, 77, 83, 92, 78]. Show each calculation with a label and explain what each statistic tells us about the data."

**Box plot:**
> "Write Python code to create a box plot for this set of student scores: [55, 60, 65, 70, 72, 75, 78, 80, 82, 85, 88, 90, 95, 97, 100]. Label the quartiles and median. Title it 'Test Score Distribution'."

**Scatter plot + line of best fit:**
> "Write Python code to create a scatter plot with a line of best fit for this data showing hours studied vs. test score: x=[1,2,3,4,5,6,7,8], y=[55,60,65,70,72,80,85,90]. Calculate and display the correlation coefficient."

---

## 5. LESSON CONTENT WITH CODE EXAMPLES

> "I'm teaching [TOPIC] to [GRADE] students. Write me a short explanation of the concept, followed by Python code that demonstrates it visually or computationally. Then write 3 questions students could answer after seeing the code run."

### Example:
> "I'm teaching the concept of slope to 8th graders. Write a short explanation of slope, then Python code that graphs 3 different lines with different slopes and lets students visually compare them. Then write 3 discussion questions."

---

## 6. JUPYTER NOTEBOOK LESSON PLAN

> "Create a Jupyter Notebook outline for a [GRADE] [SUBJECT] lesson on [TOPIC]. Include: a text explanation of the concept, Python code cells that demonstrate the math, practice problems where students fill in the code, and 3 reflection questions. Write in a format that a math teacher with no coding background can follow."

**Note:** Google Colab (colab.google.com) lets students run Jupyter notebooks FREE in a browser — no installation needed.

---

## 7. GITHUB COPILOT FOR WORD PROBLEMS (no code needed)

Copilot Chat also works like ChatGPT for text. You can ask:

> "Write 5 word problems about [TOPIC] for [GRADE] students using real-world contexts. Include full solutions."

> "Explain [MATH CONCEPT] to a 10th grade student who is struggling. Use simple language and a real-world analogy."

---

## CRITICAL NOTES: WHERE GITHUB COPILOT IS DIFFERENT

| Dimension | GitHub Copilot | ChatGPT / Claude |
|---|---|---|
| **Math accuracy** | Runs the code → verified result | Relies on memory → can be wrong |
| **Learning curve** | Slight — need to run code | None — just read the output |
| **Best for** | Visual/computational math, stats, interactive tools | Content generation, explanations, worksheets |
| **Output type** | Code + text | Text only (unless using Artifacts) |
| **Verification** | Built-in — the code either works or it doesn't | You must verify manually |

**When to use Copilot over ChatGPT:**
- You want a GRAPH, not a description of a graph
- You want math that is COMPUTED, not approximated
- You want students to INTERACT with the math (not just read it)
- You teach Statistics and need data analysis tools

---

## ACADEMIC INTEGRITY NOTE

GitHub Copilot raises the same concerns as all AI tools:
- If students have access to Copilot, they can generate code for coding assignments
- However, for math class: use it as a DEMONSTRATION tool (teacher-facing) rather than a student tool
- The real value: YOU use Copilot to create things you couldn't before — interactive demos, visualizations, automated checks

---

## QUICK START — TRY THIS IN THE NEXT 5 MINUTES

1. Go to **github.com/copilot** and sign in
2. Type: *"Write Python code to graph y = x² from -5 to 5. Label the axes and vertex. Title it 'Parabola'. Explain the code simply."*
3. See the code → click Run (or copy to colab.google.com)
4. You now have a live math graph you made yourself

That's GitHub Copilot for math teachers.
