# AGENTS.md — Movie Rating Duel

## 1. Project Overview

Project name: Movie Rating Duel

Working title in Chinese: 谁的评分更高？

This project is a browser-based movie rating comparison game.

The player sees two movies and selects the movie with the higher rating. Each game starts with five lives. A wrong answer removes one life. The game ends when lives reach zero.

The game supports three difficulty levels:
- Normal
- Advanced
- Expert

Players can optionally filter movies by release year.

The first release is a single-player MVP. Prioritize correctness, usability, maintainability, and reliable testing over feature count.

## 2. Technology Stack

The default stack is:

- React
- TypeScript
- Vite
- CSS or CSS Modules
- Vitest for unit tests
- React Testing Library for component tests
- Playwright for end-to-end tests when appropriate
- Git for version control

Do not replace the technology stack without explicit approval from the project owner.

Do not add a dependency when the existing stack can solve the problem cleanly. Explain why a new dependency is needed before introducing it.

Use the package manager already established by the repository. Do not create conflicting lockfiles.

## 3. Required Working Principles

### 3.1 Read Before Editing

Before starting a task:

1. Read this file.
2. Read the relevant project documents in `docs/`.
3. Inspect the current repository structure.
4. Inspect relevant source files and tests.
5. Identify the exact files that need to change.
6. State the intended implementation briefly before making substantial changes.

Do not assume the repository is empty or that previous work does not exist.

### 3.2 Work in Small, Verifiable Tasks

Implement one clearly scoped task at a time.

For each task:

1. Explain the intended change.
2. Implement the smallest reasonable solution.
3. Add or update relevant tests.
4. Run applicable checks.
5. Inspect the diff.
6. Report the files changed, commands executed, results, and remaining issues.

Do not rewrite unrelated files or refactor the entire application for a small feature.

### 3.3 Preserve Existing Behavior

Do not silently remove existing functionality.

Do not delete or weaken tests to make a task pass.

Do not change public interfaces, data formats, routing, or established conventions without explaining the impact.

If a requirement conflicts with existing architecture or documentation, report the conflict and propose a minimal solution.

### 3.4 Never Fabricate Results

Never claim that a command, test, build, deployment, API request, or review succeeded unless its result was actually observed.

If a command cannot be executed, state that it was not executed and explain why.

Do not report placeholder data as real movie data.

## 4. Product Scope

### MVP Features

The first release should support:

- A home page with game instructions.
- Three difficulty levels.
- Optional start-year and end-year filters.
- Two distinct movies per question.
- Movie title and release year.
- Movie rating and rating source.
- Five lives per game.
- One answer submission per question.
- Correct and incorrect answer feedback.
- One point for each correct answer.
- One lost life for each incorrect answer.
- Game over when lives reach zero.
- Final score and accuracy.
- Restarting the game.
- Responsive desktop and mobile layouts.
- Graceful handling of missing images and insufficient question data.

### Out of Scope for the MVP

Do not implement these without explicit approval:

- User registration or login.
- Global leaderboards.
- Multiplayer or real-time matchmaking.
- Payments or subscriptions.
- Social features.
- AI-generated movie ratings.
- Complex adaptive difficulty.
- A dedicated backend solely for basic single-player game logic.

## 5. Game Rules

The game must follow these rules:

1. Every new game starts with exactly five lives.
2. A correct answer increases the score by one.
3. An incorrect answer removes exactly one life.
4. Lives must never fall below zero.
5. A question can only be answered once.
6. No additional answer may be accepted after game over.
7. The game ends when lives reach zero.
8. Restarting resets the score, lives, answer counters, and per-game question history.
9. The two movies in a question must have different stable IDs.
10. Equal-rating movies must not be used as normal questions.
11. Both movies must satisfy the selected release-year range.
12. Movie ratings must be compared numerically, not lexicographically.
13. Question generation must terminate safely when no valid pair exists.
14. The left and right positions must not systematically favor the higher-rated movie.
15. Do not repeat the same unordered movie pair during a game while unused valid pairs remain.

Accuracy is:

correct answers / total answered questions

If no questions have been answered, display accuracy as 0% or an appropriate not-yet-available state. Never divide by zero.

## 6. Difficulty Rules

Difficulty rules must be centralized in a dedicated configuration or module.

Initial proposed rating-gap ranges:

- Normal: 0.8 to 2.0
- Advanced: 0.3 to 0.7
- Expert: 0.1 to 0.2

These are initial product parameters, not immutable requirements. The project owner may change them after playtesting.

The absolute rating gap is:

abs(movieA.rating - movieB.rating)

Do not duplicate difficulty thresholds across UI components.

The difficulty engine must also handle insufficient candidate movies or valid pairs without infinite loops.

Do not silently widen difficulty thresholds unless the fallback behavior is explicitly documented and approved.

## 7. Movie Data and Source Policy

During initial development, use synthetic test data clearly labeled as test data.

Never claim synthetic ratings are real Douban ratings.

Every movie record should have a stable ID, title, release year, rating, and rating source.

Optional fields may include poster URL, detail URL, and rating update timestamp.

Validate incoming movie data before it is used by the game.

Check for:
- Duplicate IDs.
- Empty titles.
- Invalid years.
- Non-finite or out-of-range ratings.
- Missing or ambiguous rating sources.
- Missing images.
- Duplicate movie records.
- Equal-rating pairs.

Do not scrape Douban or rely on an unofficial API without an approved legal and technical plan.

Do not bypass authentication, access controls, rate limits, or other technical restrictions.

Before publishing real Douban ratings, movie metadata, or posters, the project owner must confirm that the intended use is authorized.

Use a data adapter or similarly isolated boundary so the data source can be changed without rewriting the game engine.

## 8. Architecture and Code Quality

Keep responsibilities separate:

- UI components render interface elements.
- Game logic determines valid questions and game state.
- Data modules validate and provide movie records.
- Difficulty configuration defines question selection rules.
- Tests verify behavior independently of presentation.

Prefer small, focused functions and components.

Use TypeScript types instead of unnecessary `any`.

Avoid giant components, duplicated business logic, deeply nested conditionals, and unnecessary global state.

Use immutable state updates where appropriate.

Avoid unnecessary abstractions for hypothetical future requirements.

Keep user-facing messages clear and helpful.

Handle empty datasets, invalid filters, unavailable images, and unexpected data gracefully.

## 9. Testing Requirements

Add tests for every important game rule.

At minimum, cover:

- Numeric rating comparison.
- Equal ratings.
- Invalid movie data.
- Year filtering.
- Difficulty filtering.
- Empty candidate pools.
- Valid pair generation.
- Duplicate-pair prevention.
- Correct answers.
- Incorrect answers.
- Exactly one life lost per incorrect answer.
- Life count never below zero.
- Repeated submissions.
- Game-over behavior.
- Restart behavior.
- Accuracy calculation.
- Invalid or reversed year ranges.

For UI changes, test the relevant user interactions.

For end-to-end tests, verify at least one complete game flow when the test environment is available.

Use deterministic or injected randomness in tests where possible. Do not write flaky tests that depend on uncontrolled random outcomes.

Do not modify production logic just to satisfy an incorrect test. Investigate the requirement and the failure first.

## 10. Security and Configuration

Never commit API keys, passwords, access tokens, or other secrets.

Keep `.env` files containing secrets out of Git.

Provide `.env.example` with placeholder values when configuration is required.

Never expose a private server-side API key through a Vite client environment variable.

Validate external data before rendering it.

Avoid unsafe HTML injection and unnecessary external scripts.

Do not add analytics or transmit user data without explicit product approval.

## 11. Git and Change Management

Keep `main` in a buildable state.

Use small, descriptive branches and commits where practical.

Before committing:

1. Run relevant tests.
2. Run type checking.
3. Run a production build when appropriate.
4. Run `git diff --check`.
5. Inspect `git diff`.
6. Confirm no secrets or unrelated changes are included.

Never force-push, delete branches, discard user changes, or rewrite Git history without explicit approval.

Do not run destructive Git commands automatically.

The project owner approves important merges and production deployments.

## 12. Code Review

An independent reviewer should inspect substantial changes.

Review priorities:

1. Incorrect game rules.
2. Data accuracy and source compliance.
3. Infinite loops and invalid question generation.
4. State-management bugs and repeated submissions.
5. Security and secret exposure.
6. Missing tests.
7. Accessibility and responsive behavior.
8. Maintainability and unnecessary complexity.

Distinguish confirmed defects from speculative concerns.

Provide file paths, reproduction steps, severity, and a proposed fix for each significant issue.

A reviewer must not claim that code is safe or correct beyond the scope actually inspected.

## 13. Definition of Done

A task is complete only when:

- The requested behavior is implemented.
- Relevant tests are added or updated.
- Applicable tests have been executed, or execution limitations are documented.
- Type checking and production build are verified when appropriate.
- No unrelated changes are introduced.
- The diff has been inspected.
- Remaining limitations are disclosed.
- The task status in `docs/TASKS.md` is updated when that file exists.

## 14. Final Response Format

After each coding task, report:

1. Summary of the implementation.
2. Files created or changed.
3. Commands actually executed.
4. Test and build results.
5. Known issues and unverified assumptions.
6. Suggested next task.

Keep reports concise but specific. Never conceal a failed check.

## 15. Priority Order

When trade-offs are necessary, prioritize:

1. Correctness.
2. Data integrity and lawful data usage.
3. User experience.
4. Testability.
5. Maintainability.
6. Performance.
7. Additional features.

The objective is a small, reliable, understandable game—not the largest possible codebase.
