# Vendor Directory

This directory contains third-party UI components (e.g., from EldoraUI, MagicUI, Aceternity).

## Rules (Règle 01 - Vendor Isolation)

1.  **NO DIRECT IMPORTS**: Never import components from this directory directly into pages or features.
2.  **ADAPTER PATTERN**: Always create a wrapper component in `src/components/ui/` that consumes the vendor component.
3.  **ISOLATION**: This directory may be excluded from strict linting rules if necessary.

## Structure

Each component should have its own folder:
```
src/components/vendor/
├── text-gradient/
│   ├── index.tsx
│   └── text-gradient.tsx
└── ...
```
