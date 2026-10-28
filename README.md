# Advent Calendar

A static Advent calendar for GitHub Pages. One door opens each day from December 1 to Christmas Day.

- **Today's door** glows and can be opened. The hint shows first, and you click **Reveal the answer** to see the answer.
- **Past doors** look like opened parchment, and you can reopen them at any time. Use Previous/Next (or the arrow keys) to page through them.
- **Future doors** stay sealed and show how many days are left.

## Content

The daily hints and answers come from [`jokes.md`](jokes.md). Each day is a `### ... December N` heading, followed by the hint on one line and the answer on the next line. Edit that file to change the content.

## Simulating a date

Add a query parameter to the URL:

| Parameter | Example | Meaning |
|-----------|---------|---------|
| `day`  | `?day=10`          | Pretend it is December 10 of this season |
| `date` | `?date=2026-12-24` | Pretend it is any specific date |

A banner shows while a date is being simulated, with a link back to the real date.

> Note: the gating happens in the browser, so anyone who looks in `jokes.md` can read the content. The gating keeps the surprise; it does not keep the content secret.

## Running locally

```sh
python3 -m http.server 8000
# open http://localhost:8000/?day=12
```
