# Beyond 100 UI quality checks

This file records the visual/interaction checks that should be made before treating a UI change as complete. The GitHub Pages workflow also runs browser smoke tests for the most regression-prone interactions.

## Automated browser checks

The deployment must verify that:

- Focus starts a diagnostic with one child-facing question.
- Child confidence choices are hidden until the answer is marked Done.
- the compact Focus dock does not expose a running seconds counter to the child.
- all confidence choices have equal neutral styling before selection.
- opening the parent panel on a desktop/iPad-size viewport does not overlap the child task card.
- core parent response controls are large enough to read without strain.
- Notes activity summary is expanded when Notes opens.
- the learning statistics dashboard opens and renders.
- the Parent Controller pairing modal never presents an entirely blank QR/status area.

## Manual device checks

When a change affects Focus or remote control, also check:

1. iPad landscape: child task remains the dominant object on screen.
2. iPad portrait: Done, confidence and compact Parent dock remain reachable without covering the question.
3. iPhone parent controller: connection state identifies Sai and distinguishes connecting, connected, signed-out and revoked states.
4. QR pairing: first-time creation, cached/reopened controller, incognito token link, and disconnect/revoke.
5. Parent panel selections: selected state is obvious and does not cause the panel to jump over or obscure the child task.
6. Type sizes: no instructional/control text should require zooming or straining to read.
7. Default states: no option should appear pre-selected unless it actually represents a stored state.

## Product check

Every Focus change should still satisfy the core test:

> The child sees one small thing to think about; the parent gets just enough control to observe, record and decide what happens next.
