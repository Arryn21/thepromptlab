/* math-tools.js — Ask AI How to Use It buttons + picker prompt copy */

(function () {

  const TOOL_PROMPTS = {
    'Desmos Graphing Calculator': `Give me a complete teacher's guide to using the Desmos Graphing Calculator in my math classroom. Be specific and practical.

Cover all of the following:

1. GETTING STARTED
   - How to access it (no account needed vs. with account)
   - The interface layout — what each panel and button does
   - How to type math expressions correctly (exponents, fractions, absolute value, etc.)

2. CORE FEATURES FOR TEACHERS
   - How to graph multiple functions at once and change their colors
   - How to create sliders so students can explore how changing a value transforms a graph
   - How to restrict the domain of a function (e.g. show only part of a line)
   - How to plot points and label them
   - How to add text annotations and notes to a graph
   - How to find intersections, zeros, and key points

3. CLASSROOM USES (give a specific example for each)
   - Exploring transformations (shifts, reflections, stretches)
   - Comparing parent functions and their families
   - Visualizing systems of equations
   - Demonstrating calculus concepts (tangent lines, area under a curve)
   - Creating a graph students can interact with during a lesson

4. SHARING & STUDENT USE
   - How to generate a shareable link to a graph
   - How students can use it without an account
   - How to embed a graph in Google Slides or a website

5. TOP 5 TEACHER TIPS
   - Things most teachers don't discover until months in

6. COMMON MISTAKES TO AVOID
   - Syntax errors beginners always make
   - Accessibility and mobile limitations

End with 3 ready-to-use classroom activity ideas I can run this week.`,

    'Desmos Activity Builder': `Give me a complete teacher's guide to using the Desmos Activity Builder to create interactive math lessons. Be specific and practical.

Cover all of the following:

1. WHAT IT IS AND HOW IT DIFFERS FROM THE GRAPHING CALCULATOR
   - Activity Builder vs. plain Desmos calculator — what's the difference?
   - What a "screen" is and how multi-screen activities work
   - The student view vs. the teacher dashboard view

2. CREATING AN ACTIVITY FROM SCRATCH
   - How to log in and start a new activity
   - The different screen types: graph, note, input, sketch, card sort, marbleslides
   - How to add instructions and math content to each screen
   - How to add a Desmos graph that students can interact with

3. RUNNING AN ACTIVITY LIVE IN CLASS
   - How to create a class code and share it with students
   - The Teacher Dashboard — how to monitor student responses in real time
   - How to "pause" the class and show a student's work to everyone
   - How to use the pacing feature to control when students move forward

4. USING PRE-MADE ACTIVITIES
   - Where to find the Desmos activity library
   - How to search by topic and grade level
   - How to copy and customize an existing activity

5. SPECIFIC ACTIVITY IDEAS (give full instructions for at least 2)
   - A transformations exploration with sliders
   - A card sort activity for matching equations and graphs

6. TIPS FOR STUDENT ENGAGEMENT
   - What makes a great activity vs. a confusing one
   - How to write good prompts that generate mathematical thinking

End with a step-by-step plan for building my first activity in under 20 minutes.`,

    'ClassCalc': `Give me a complete teacher's guide to using ClassCalc in my math classroom for both instruction and testing. Be specific and practical.

Cover all of the following:

1. WHAT CLASSCALC IS AND WHY IT EXISTS
   - The problem it solves (calculator access during tests without internet cheating)
   - How the lockdown mode works technically
   - What students can and cannot do in lockdown mode

2. SETTING UP CLASSCALC AS A TEACHER
   - How to create a teacher account (free vs. paid features)
   - How to create a class and generate a student lockdown code
   - How to customize which calculator features are available during a test
   - How to start and end a lockdown session

3. CALCULATOR MODES AVAILABLE
   - Basic calculator features
   - Scientific calculator functions
   - Graphing calculator features
   - What each mode looks like and when to use it

4. RUNNING A TEST WITH CLASSCALC
   - Step-by-step: from handing out devices to collecting them
   - What students see when they enter the lockdown code
   - How to handle a student who closes the app or switches tabs
   - How to end the session when the test is done

5. USING IT FOR REGULAR INSTRUCTION (not just tests)
   - How to use it as a free graphing calculator for classwork
   - Comparing ClassCalc to Desmos for daily use

6. COMMON PROBLEMS AND SOLUTIONS
   - What to do if a student's device won't load ClassCalc
   - Browser compatibility issues
   - Frequently asked parent/admin questions about security

End with a sample testing protocol I can share with students before their first ClassCalc test.`,

    'GeoGebra': `Give me a complete teacher's guide to using GeoGebra in my math classroom. Be specific and practical.

Cover all of the following:

1. WHAT GEOGEBRA IS AND HOW IT DIFFERS FROM DESMOS
   - The suite of apps: Graphing, Geometry, 3D, CAS, Spreadsheet, Probability
   - When to use GeoGebra vs. Desmos
   - Account setup and the GeoGebra Classroom feature

2. THE GEOMETRY APP (most commonly used for high school)
   - How to construct geometric figures (points, lines, circles, polygons)
   - How to use the toolbar — every tool explained
   - How to measure angles, lengths, and areas
   - How to create dynamic constructions that move when you drag points
   - Classic geometry constructions: perpendicular bisector, angle bisector, circumscribed circle

3. THE GRAPHING APP
   - How it compares to Desmos (what GeoGebra does that Desmos can't)
   - Graphing functions and inequalities
   - Using sliders for exploration
   - Plotting derivatives and tangent lines for calculus

4. THE 3D GRAPHING APP
   - When to use it (solids, surface area, volume, 3D vectors)
   - How to rotate and explore 3D shapes
   - Specific examples for high school geometry or pre-calc

5. FINDING AND USING PRE-MADE ACTIVITIES
   - How to search GeoGebra's activity library (thousands of free resources)
   - How to add an activity to your GeoGebra Classroom
   - How to assign an activity to students and track their progress

6. CREATING YOUR OWN ACTIVITY
   - How to build a dynamic geometry construction students can explore
   - How to add instructions and questions inside GeoGebra
   - How to share it with a class code

7. TIPS FOR PROOF-BASED GEOMETRY
   - How to use GeoGebra to make proofs visual and dynamic
   - How to let students test conjectures before proving them

End with 3 specific lesson ideas I can use this week with my current unit.`,

    'Wolfram Alpha': `Give me a complete teacher's guide to using Wolfram Alpha in my math classroom — both for my own lesson prep and for teaching students to use it responsibly. Be specific and practical.

Cover all of the following:

1. WHAT WOLFRAM ALPHA IS
   - How it's different from a search engine and different from ChatGPT
   - What kinds of math questions it can answer
   - Free vs. Pro features (what teachers actually need)

2. HOW TO QUERY WOLFRAM ALPHA EFFECTIVELY
   - How to phrase math queries correctly
   - How to input specific notation (fractions, exponents, integrals, matrices, etc.)
   - What to do when it misinterprets your question
   - Examples of queries for: algebra, geometry, statistics, pre-calc, calculus

3. FEATURES MOST TEACHERS DON'T KNOW ABOUT
   - Step-by-step solutions (how to access them)
   - Alternate forms of an expression
   - Plotting and graphing inside Wolfram Alpha
   - Domain and range analysis
   - Series expansions, limits, derivatives, integrals

4. HOW TO USE IT FOR LESSON PREP
   - Verifying your own calculations and answer keys
   - Generating worked examples for specific problem types
   - Exploring number theory, patterns, and sequences
   - Creating visual representations of concepts

5. TEACHING STUDENTS TO USE IT RESPONSIBLY
   - The difference between using it as a learning tool vs. a cheating tool
   - How to assign problems where Wolfram Alpha is allowed (and what that teaches)
   - How to assign problems that Wolfram Alpha cannot easily solve
   - A classroom discussion framework: "What does this answer mean?"

6. SPECIFIC EXAMPLES BY TOPIC
   - Algebra: solving equations, factoring, simplifying
   - Geometry: area, perimeter, coordinate geometry
   - Statistics: mean, median, standard deviation, distributions
   - Pre-Calculus: limits, function analysis
   - Calculus: derivatives, integrals, series

End with a one-page student guide I can hand out explaining when and how to use Wolfram Alpha on assignments.`,

    'Khan Academy': `Give me a complete teacher's guide to using Khan Academy as a math teacher — specifically the teacher tools for assigning, tracking, and differentiating. Be specific and practical.

Cover all of the following:

1. SETTING UP YOUR TEACHER ACCOUNT AND CLASS
   - How to create a teacher account and add a class
   - How to add students (class code, Google, or Clever)
   - How to set up multiple classes or sections
   - Parent notification settings

2. UNDERSTANDING THE CONTENT LIBRARY
   - How the content is organized (courses, units, lessons, exercises)
   - What's available for high school math (Algebra 1 & 2, Geometry, Pre-Calc, Calculus, Stats)
   - Videos vs. articles vs. exercises — what each is best for
   - How to preview content before assigning it

3. ASSIGNING CONTENT TO STUDENTS
   - How to assign a specific exercise set, video, or unit
   - Setting due dates and pacing
   - Assigning to the whole class vs. individual students (differentiation)
   - How to assign a "course mastery" path vs. specific skills

4. THE TEACHER DASHBOARD
   - How to read student progress reports
   - What "mastery," "practiced," and "started" mean
   - How to identify struggling students in real time
   - How to see exactly which problems a student got wrong

5. USING KHAN ACADEMY FOR DIFFERENTIATION
   - How to assign different content to different students
   - How to use it for intervention (below grade level) and enrichment (above)
   - Setting up a self-paced mastery system in your classroom

6. USING IT ALONGSIDE YOUR REGULAR TEACHING
   - As homework to reinforce the day's lesson
   - As bell work or warm-up
   - As a substitute plan (students work independently on a specific assignment)
   - As a station in a rotation model

7. KHANMIGO (AI TUTOR) — IF AVAILABLE
   - What it is and what it can do for students
   - How to enable it and set guardrails

End with a sample 2-week plan showing how to integrate Khan Academy into a unit on quadratic functions.`
  };

  const PICKER_PROMPT = `I teach [SUBJECT] to [GRADE] students. I want to use a free digital tool for [GOAL — e.g. exploring transformations, practicing algebra, geometry proofs]. Which tool should I use — Desmos, GeoGebra, ClassCalc, or Wolfram Alpha — and how do I set it up in under 10 minutes?`;

  // ── Ask AI buttons ──────────────────────────────────────────
  document.querySelectorAll('.math-tool-ask-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const toolName = btn.dataset.tool;
      const prompt   = TOOL_PROMPTS[toolName];
      if (!prompt) return;

      try { await navigator.clipboard.writeText(prompt); }
      catch {
        const ta = document.createElement('textarea');
        ta.value = prompt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);

      window.showToast?.(`"${toolName}" guide prompt copied — paste it into ChatGPT or Claude!`, 'success', 3000);
    });
  });

  // ── Picker prompt copy ──────────────────────────────────────
  const pickerBtn = document.getElementById('math-picker-btn');
  if (pickerBtn) {
    pickerBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(PICKER_PROMPT); }
      catch {
        const ta = document.createElement('textarea');
        ta.value = PICKER_PROMPT;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const orig = pickerBtn.textContent;
      pickerBtn.textContent = '✓ Copied!';
      setTimeout(() => { pickerBtn.textContent = orig; }, 2000);
      window.showToast?.('Prompt copied — paste it into ChatGPT or Claude!', 'success', 2500);
    });
  }

})();
