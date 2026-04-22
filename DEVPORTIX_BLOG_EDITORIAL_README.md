# DevPortix Blog Editorial README

This document defines the default house style for every DevPortix blog post.

## Goal

Every previous and future DevPortix blog post should feel like it belongs to the same editorial system:

- publication-style reading flow
- strong technical credibility
- clear section rhythm
- branded DevPortix visual language
- consistent image placement
- a closing that connects the topic back to proof, engineering clarity, or professional trust

## House Style

All DevPortix blog posts should follow this structure where possible:

1. `Lead`
   A clear opening paragraph that frames the real engineering, product, hiring, or systems question.

2. `Why this matters`
   Explain the consequence in practical terms.

3. Named sections
   Use short section headings separated by blank lines so the renderer can style them as editorial subheads.

4. Visual rhythm
   The post should support:
   - one hero image
   - one early inline image
   - one later supporting image
   - one lower-page visual break when available

5. Quote block
   Include one short memorable line only when it adds editorial clarity.

6. `Closing perspective`
   Tie the article back to engineering craft, proof of work, systems thinking, or DevPortix's value.

7. `Closing`
   End with a concise final line that feels earned rather than promotional.

## Writing Rules

- Write for engineers, technical builders, and software-adjacent readers.
- Prefer credibility over hype.
- Use concrete language, tradeoffs, and systems framing.
- Avoid generic motivational filler.
- Keep headings short and readable.
- Use blank lines between sections.
- Use images that support the argument, not generic decoration.

## Visual Rules

- Keep navbar styling unchanged.
- Maintain DevPortix brand colors, especially the sky/blue family.
- Non-editorial posts should still render with publication-style structure.
- If an uploaded image is missing, the UI should fall back to topic-aligned DevPortix visuals.

## Super Admin Template Standard

The super-admin template library should default to:

- a DevPortix house-style editorial draft
- structured section headings
- checklist-driven publishing guidance
- cover/image notes that encourage editorial-quality visuals

## Renderer Notes

The blog renderer is expected to recognize:

- heading-like standalone paragraphs such as `Lead`, `Why this matters`, `Closing perspective`, and similar short labels
- quote blocks wrapped in quotation marks
- normal body paragraphs as the primary reading flow

This keeps raw CMS-style blog posts aligned with the same presentation system used across DevPortix.
