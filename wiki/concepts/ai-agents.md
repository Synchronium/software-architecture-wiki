---
title: "AI Agents"
type: concept
tags: [ai, llm, agents, planning, tool-use, function-calling, multi-agent, reflection]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# AI Agents

## Definition

An AI agent is a system that can perceive its environment and act upon it. In the context of foundation model applications, the model serves as the planning brain that analyses tasks, chooses actions from a tool inventory, executes them, and reflects on outcomes to determine whether the goal has been achieved. (→ [[sources/ai-engineering]] ch. 6)

RAG systems are a special case of agents — the retriever is a tool the model can use.

## Why Agents Matter

Without tools, a model can perform one kind of action (text generation, image generation). Tools multiply an agent's capabilities. A GPT-4 agent with 13 tools (Chameleon, Lu et al. 2023) outperformed GPT-4 alone on several benchmarks: +11.37% on ScienceQA, +17% on TabMWP.

Tool-augmented agents enable automation of entire workflows: research → draft → send email → update database → follow up.

## Tool Categories

**Knowledge augmentation (read-only):**
- Text retriever, image retriever, SQL executor
- Web search (prevents model staleness; access current news, stock prices, weather)
- Internal APIs (inventory, Slack, email reader, people search)

**Capability extension:**
- Calculator, calendar, timezone/unit converter
- Code interpreter (write and execute code; enables data analysis, automated experiments)
- Transcription, OCR, image captioning (expand a text-only model to process other modalities)
- Text-to-image, text-to-video tools (expand outputs to other modalities)

**Write actions** (higher capability, higher risk):
- Database mutations, email sending, bank transfers, code merges
- Require explicit human approval before execution for safety; treat with the same caution as write access in traditional systems

## Planning

Planning is the process by which the agent generates a sequence of actions (a plan) to achieve the task goal.

### Plan Generation

The simplest approach: prompt engineering with chain-of-thought and few-shot examples of (task, plan) pairs. The model generates a sequence of function calls with parameters inferred from prior step outputs.

**Natural language plans** (higher level): the plan is expressed in natural language ("retrieve best-selling product"); a separate translation module maps each action to executable commands. More robust to tool inventory changes; reduces hallucination.

**Plan granularity:** sequential plans are simplest; complex plans may use:
- **Parallel** — independent actions executed concurrently (reduces latency)
- **If statement** — condition-dependent branching
- **For loop** — repeated action until a condition is met

### Plan Validation

Plans should be validated before execution:
- Heuristics: reject plans containing unknown tools; reject plans exceeding step budget.
- AI judge: ask a model to evaluate whether the plan is reasonable.
- Only execute validated plans.

### ReAct Pattern (Yao et al. 2022)

Interleave reasoning and action at each step:

```
Thought 1: [reasoning about the current state]
Act 1: [action taken]
Observation 1: [result of the action]
...
Thought N: [task is complete]
Act N: Finish [final response]
```

The interleaving forces the agent to articulate its reasoning and self-correct at each step. Reflexion (Shinn et al. 2023) extends this with a dedicated self-reflection module that analyses failures and proposes a new trajectory.

### Reflection and Error Correction

Reflection evaluates whether the plan or its execution is on track. It can occur:
- After receiving the initial task (is this feasible?)
- After plan generation (is this plan reasonable?)
- After each execution step (are we on track?)
- After the entire plan (has the goal been achieved?)

Reflection can be implemented via:
- Self-critique prompts (same model)
- A separate evaluator agent in a multi-agent system
- A specialised scorer model

If reflection detects failure, the agent generates a corrected plan. This allows learning from mistakes within a session (not via weight updates).

### Multi-Agent Systems

Complex agents decompose naturally into multiple interacting components:
- **Planner** — generates plans
- **Evaluator** — validates plans and inspects outcomes  
- **Executor** — calls tools and executes actions
- **Intent classifier** — routes queries to the right sub-agent; marks out-of-scope queries as IRRELEVANT

Each component can be a separate model call. Most real-world agents are multi-agent systems.

## Function Calling

Model APIs expose function calling (tool use) as a first-class feature:

1. Declare a tool inventory — each tool described by name, parameters, and documentation.
2. Specify which tools the model may use per query (required / none / auto).
3. The model outputs tool call specifications (function name + parameter values).
4. Application code executes the tool and returns the result.
5. The model incorporates the result and continues planning.

Key practice: always log each tool call and its parameter values. Hallucinated function names or incorrect parameter values are common failure modes.

## Tool Selection

No definitive guide; requires experimentation:
- Compare agent performance with different tool sets.
- Ablation: remove one tool at a time and measure performance drop; prune tools that don't contribute.
- Monitor tool usage distribution: identify unused tools (prune) and frequently failing tools (fix or replace).
- Prefer tools with clear APIs and extensive documentation — ambiguous tools lead to incorrect parameter values.
- Consider the agent's model: different models have different tool preferences (GPT-4 favours knowledge retrieval; ChatGPT favoured image captioning in Chameleon experiments).

## Agent Failure Modes

### Planning Failures
- **Invalid tool** — plan calls a function not in the tool inventory.
- **Invalid parameters** — correct tool, wrong parameter count or types.
- **Incorrect parameter values** — correct tool and structure, wrong values.
- **Goal failure** — plan does not solve the task or violates constraints (e.g. exceeded budget, wrong destination).
- **Reflection error** — agent is incorrectly convinced the task is complete when it isn't.

### Tool Failures
- Tool produces wrong output (independent of agent planning).
- Translation module error (when natural language plans are used).
- Missing tool — agent doesn't have access to the capability required by the task.

### Efficiency Failures
- Too many steps for a task that should be straightforward.
- Excessive API cost per task.
- Slow actions that delay user response unnecessarily.

## Evaluation

**Planning evaluation:**
- For each task, generate K plans; count the fraction that are valid.
- Average number of plans needed before a valid one is produced.
- Per-tool call validity rates.
- Failure pattern analysis: which task types and which tools fail most often?

**Tool evaluation:** each tool tested independently with dedicated benchmarks.

**End-to-end evaluation:** did the agent accomplish the goal within constraints? How many steps did it take? What was the cost?

Agent benchmarks: Berkeley Function Calling Leaderboard, AgentOps evaluation harness, TravelPlanner benchmark.

## Safety Considerations

Write actions expose agents to the same risks as prompt injection (→ [[concepts/prompt-engineering]]):
- Indirect prompt injection: malicious instructions embedded in tool outputs (emails, web pages, database records) can hijack the agent's plan.
- Never allow unrestricted database mutations or financial transactions; require human approval.
- Execute generated code in isolated sandboxes.
- Compound errors: 95% accuracy per step → 60% over 10 steps → 0.6% over 100 steps. More capable agents require more defensive design.

## Can LLMs Plan?

An open debate. Yann LeCun (Meta) and Kambhampati (2023) argue that autoregressive LLMs cannot genuinely plan. Counter-arguments:
- Planning is search; LLMs can encode world models that enable action outcome prediction (Hao et al. 2023).
- LLMs can backtrack effectively by restarting with a revised plan upon detecting failure.
- Augmenting LLMs with search tools and state tracking may be sufficient.

Even if LLMs cannot plan autonomously, they can contribute to hybrid planners — FM agents and RL agents are expected to converge over time.

## Key Takeaways

- An agent is characterised by its environment, tool inventory, and planning capability — all three must be designed explicitly.
- Tool use multiplies capabilities but also multiplies failure modes; accuracy degrades multiplicatively with plan length.
- ReAct (reasoning + action interleaved) and Reflexion (dedicated self-reflection module) are the dominant planning frameworks.
- Write actions demand human-in-the-loop approval and sandbox isolation.
- Multi-agent systems are the norm for anything non-trivial; plan separately from execution, validate before executing.

## Related Concepts

- [[concepts/rag]] — RAG is a special case of agent; retrieval is the tool
- [[concepts/prompt-engineering]] — chain-of-thought and system prompt design underlie agent planning; prompt injection is the primary security threat
- [[concepts/ai-evals]] — agent evaluation; task-based vs turn-based evaluation
- [[concepts/llm-sampling]] — test-time compute and sampling strategies affect planning quality
