# CeptLens Term Design Guide

This guide describes the quality bar for an AI model learning term. It is based on the design of **Attention Scores and Weighted Aggregation**, but the principles apply to terms about training, inference, architectures, optimization, compression, and deployment.

## The Goal

A term is a self-contained lesson about one connected concept. It should help a software engineer with little model knowledge answer:

1. What is this concept and why is it needed?
2. What are its inputs, mechanism, and outputs?
3. Why does each important operation exist?
4. What changes when an important variable changes?
5. Where does the concept apply, and what are its boundaries?

The standard is understanding, not feature count. A small number of well-connected explanations is better than a page filled with unrelated diagrams, controls, and formulas.

## Start With One Causal Thread

Write the core conclusion in one sentence before designing the page. Then organize the term as a chain:

problem -> objects -> mechanism -> result -> example -> implementation -> boundary

For Attention Scores and Weighted Aggregation, the thread is:

an input token needs relevant context -> Q and K express a matching relationship -> matching produces scores -> scaling and Softmax produce weights -> V carries content -> weighted aggregation produces a new representation

Every section should move this thread forward. Remove material that does not help the reader follow it.

## Establish the Reader's Starting Point

State the real prerequisites before writing:

- What does the reader already know?
- What is supplied as an input?
- Which neighboring concepts have their own terms?
- What is deliberately outside this term?

The attention term assumes basic vectors and matrix multiplication, takes token representations as given, and links to the QKV term instead of duplicating a full QKV lesson. A term should give a short local explanation and a natural link when it first uses a prerequisite. It should not hide a missing prerequisite inside an unexplained adjective or downstream consequence.

## Use This Reading Order

### 1. Explain the problem

Begin with the reader's concrete question. For example: when a model interprets one token, which other tokens should influence it?

Explain why the current information is insufficient before naming the next operation. This makes each later step necessary rather than arbitrary.

### 2. Define the objects in plain language

Introduce each object before using it:

- what it represents;
- what role it plays;
- where it comes from;
- what it is used for next.

For the attention term, Q and K are introduced as the two sides of a learned matching relationship. V is introduced as the content carried by a token. Their roles are clear before the equations appear.

### 3. Show the smallest useful structure

The first visual should show the actual concept structure: inputs, processing, outputs, and direction. It should be readable without the surrounding prose.

Do not begin with a dense numerical example. First show what is connected to what. Then add numbers after the reader understands the structure.

### 4. Motivate every operation

Before introducing an operation, state what remains unresolved:

- Scores describe relevance, but do not yet allocate influence.
- Softmax creates weights, but the weights do not carry content.
- V supplies content, but the target output still needs a weighted sum.

This problem-to-operation transition is more useful than listing the names of operations in advance.

### 5. Generalize after one target

Explain one target token first:

    z_i = sum_j a_ij v_j

Then show the matrix form:

    Z = AV

Only after the local operation is clear should the page present the complete formula:

    Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V

This order prevents the complete equation from becoming an object the reader must memorize.

## Design Visuals and Interactions for a Teaching Purpose

Before adding an interaction, write one sentence:

The reader changes X, sees Y, and therefore understands Z.

Keep the interaction only if that sentence is precise.

The attention term uses two complementary visuals:

- A looping score-matrix animation shows how each Q/K pair maps to one exact cell. It retains completed results, pauses on row completion and the full matrix, respects reduced motion, and pauses when off screen.
- A step-by-step walkthrough lets the reader inspect input tokens, Q/K/V, scores, scaling, Softmax, weighted aggregation, and output in sequence.

These interactions answer different questions. The animation explains the structure of QK-transpose; the walkthrough explains the numerical pipeline. Neither is required to discover the basic definition because the surrounding static text already teaches it.

Good interactions have these properties:

- the default state already communicates something meaningful;
- the controlled variable has already been defined;
- one operation changes at a time;
- the change is visible and described beside the result;
- labels, color, shape, and direction have explicit meaning;
- the interaction works with keyboard, touch, and reduced motion;
- the control instruction can be understood in one sentence.

Delete an interaction when it only adds movement, decoration, or a guessing task.

## Make Mathematics Traceable

Use the sequence:

visual object -> formula -> symbol meanings -> numerical example

For every formula:

- define each symbol near the formula;
- explain row and column meaning for matrices;
- use proper subscripts, superscripts, and mathematical rendering;
- keep dimensions and transpose operations explicit;
- make the numerical example agree with the formula.

In the attention term, the score animation labels the target row and comparison column, the walkthrough uses the same token order throughout, and the code variables scores, weights, and output map directly to the displayed matrices.

## Connect Code to the Explanation

Code should be short enough to inspect and complete enough to run. Comments should identify the corresponding conceptual step:

1. project inputs into Q, K, and V;
2. compute QK-transpose;
3. scale by the key dimension;
4. apply row-wise Softmax;
5. compute AV.

Show a transparent reference implementation first. Then show the framework primitive used in production. The attention term does this by presenting manual PyTorch code followed by scaled_dot_product_attention.

Leave batching, heads, masks, kernels, and hardware-specific optimizations for their own terms unless the current concept cannot be understood without them.

## Keep English and Chinese Conceptually Equal

Translate the reasoning, not only the labels. Both languages must preserve:

- the same causal order;
- the same qualifications;
- the same formula meaning;
- the same example and displayed values;
- the same interaction states and conclusions.

Do not let one language become a shortened summary of the other. Term IDs and links should remain stable across languages.

## Include Engineering Boundaries

End with the limits that affect real use. Depending on the topic, discuss:

- training versus inference;
- numerical stability;
- memory and compute cost;
- sequence length or tensor shape;
- hardware and operator support;
- causal or masking constraints;
- when a simpler or different method is more appropriate.

Boundaries should follow the lesson's mechanism. Do not add a generic warning list or invent misconceptions that have no evidence.

## What to Avoid

- Starting with a button, experiment, or animation before defining the concept.
- Using an operation name without explaining what its result means.
- Introducing a symbol, color, shape, or qualifier before defining it.
- Making a numerical animation carry the whole explanation.
- Showing a complete formula before the reader understands its parts.
- Repeating a neighboring term in greater detail than the current concept needs.
- Adding defensive “this is not X” sections without a real observed confusion.
- Adding controls that change several important variables at once.
- Treating visual polish, module count, or animation complexity as evidence of teaching quality.
- Publishing a term whose package passes build checks but whose example values, formulas, or interactions disagree.

## Acceptance Review

### Design review

- Can the core conclusion be stated in one sentence?
- Is the prerequisite chain real and explicit?
- Does the page begin with the problem and a plain definition?
- Does each section make the next section necessary?
- Is every interaction tied to one learning question?

### Paper review

- Can a reader understand the page without operating anything?
- Are all inputs, outputs, directions, symbols, and visual encodings defined?
- Does the first visual preserve the concept's real structure?
- Do formulas, examples, and code describe the same computation?
- Are links placed at the first useful mention of a prerequisite?

### Delivery review

- Do all interactions work, including the first and last states?
- Are keyboard, touch, narrow layouts, both languages, and reduced motion checked?
- Are values and labels updated together?
- Do package-local tests cover meaningful state and computation behavior?
- Does export and import work with the real Content Lab pipeline?
- Can an independent reviewer explain the concept without an oral supplement?

A term is ready when the reader can follow the causal chain, inspect the mechanism, connect the equation to the implementation, and state the engineering boundary.
