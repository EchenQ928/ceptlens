# Optical UI assets

## Hero illustration

- Final file: `public/brand/ceptlens-optic-hero.png` (1254 × 1254, transparent PNG).
- Created with the built-in image-generation tool, using the owner's original CeptLens logo as an identity reference.
- The owner explicitly chose this 3D variant for Home. The header retains `public/brand/ceptlens-original.png`.
- Animation is implemented separately in `BrandExperience.tsx`: layered composition, damped pointer response, animated paths, and controllable chapters. The raster itself is a static rendered asset, not a WebGL model.

Exact generation prompt:

> Use case: stylized-concept. Asset type: transparent hero illustration for CeptLens learning platform. Reference image: attached CeptLens logo, identity reference only. Create a premium photorealistic 3D product render of the LOGO SYMBOL ONLY: a thick sculptural open C-shaped optical ring framing a magnifying lens with a glowing white lightbulb at its center, handle angled lower right. Preserve the recognizability and blue/cyan identity of this symbol. Transform its materials into beautifully machined cobalt blue and translucent optical glass, crystalline bevels, layered glass edges, precise specular highlights, soft internal cyan refraction. Three-quarter frontal view with restrained depth, elegant studio lighting from upper left, luxury hardware product photography, exceptionally clean and sophisticated. Entire object isolated on a genuinely TRANSPARENT background with alpha, no floor, no rectangular backdrop, no surrounding objects, no lettering, no text, no slogan, no extra icons or stars. Centered object occupies 85% of square canvas with generous safe transparent edges. The asset will be animated as a foreground layer over independently drawn light paths. No border or UI mockup.

## Interface icons

`src/components/ProductIcon.tsx` contains hand-authored SVGs. Gradients, highlights, silhouettes, and hover articulation are implemented in source. `useId()` keeps gradient and filter references unique when many instances appear together. Utility arrows and small navigation controls still use Lucide where a simple directional symbol is appropriate.

## Typography

Noto Sans SC Variable is provided by `@fontsource-variable/noto-sans-sc`, with its upstream OFL license in the package. Font files are bundled and self-hosted through Vite; unicode-range subsets avoid downloading the whole family for each page.
