# The Shape of Numbers

> Also in this repository: **[Chain Reaction](physics/)**, twelve physicists, twelve discoveries and twelve live experiments.

Six live, interactive experiments in mathematics. Each one turns a short equation into a picture that is computed on your device as you watch.

| § | Experiment | Idea | Technique |
|---|------------|------|-----------|
| 1 | The Mandelbrot Set | `z ↦ z² + c` | WebGL fragment shader (GPU) |
| 2 | Drawing with Circles | Fourier series | Discrete Fourier transform |
| 3 | The Butterfly Effect | Lorenz equations | Runge–Kutta integration |
| 4 | The Sunflower's Secret | Golden angle, 137.508° | Vogel's model + neighbor search |
| 5 | Spirals of Primes | Primes at `(r, θ) = (p, p)` | Sieve of Eratosthenes |
| 6 | Finding π by Chance | Buffon's needle | Monte Carlo simulation |

Everything is hand-written HTML, CSS and JavaScript. There are no frameworks, no libraries, no images and no videos. The only external request is for the web fonts.

## Run it

Open `index.html` in any modern browser. No build step or server is needed.

To publish it with GitHub Pages: in the repository go to **Settings → Pages**, choose **Deploy from a branch**, pick the branch and the `/ (root)` folder, and save. The site appears at `https://<username>.github.io/<repository>/`.

## Files

```
index.html          The page and all its text
css/styles.css      Layout, typography, light and dark themes
js/core.js          Shared helpers: canvas sizing, animation loop, formatting
js/mandelbrot.js    Hero dive and §1 explorer (WebGL, with a CPU fallback)
js/fourier.js       §2 epicycles and "draw your own"
js/lorenz.js        §3 attractor and the divergence chart
js/phyllotaxis.js   §4 sunflower and spiral detection
js/primes.js        §5 prime spirals
js/buffon.js        §6 needles, estimate and convergence chart
js/main.js          Starts every experiment and the section navigation
```

## Accessibility

- Works with keyboard: every control is a real button, slider or checkbox, and the Mandelbrot and Lorenz plates respond to arrow keys.
- Respects "reduce motion": animations don't start on their own, and every one has a Play/Pause button.
- Follows the system light or dark theme.
- Every experiment runs only while it is on screen, to save battery.

## Sources

- Mandelbrot, B. B. (1980). Fractal aspects of the iteration of z ↦ λz(1 − z) for complex λ and z. *Annals of the New York Academy of Sciences*, 357, 249–259.
- Fourier, J. (1822). *Théorie analytique de la chaleur*.
- Lorenz, E. N. (1963). Deterministic nonperiodic flow. *Journal of the Atmospheric Sciences*, 20(2), 130–141.
- Gleick, J. (1987). *Chaos: Making a New Science*.
- Vogel, H. (1979). A better way to construct the sunflower head. *Mathematical Biosciences*, 44(3–4), 179–189.
- Sanderson, G. (2019). *Why do prime numbers make these spirals?* 3Blue1Brown.
- Buffon, G.-L. L., Comte de (1777). Essai d'arithmétique morale.
