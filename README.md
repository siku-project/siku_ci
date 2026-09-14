# siku_ci

Les vérifications partagées de l'écosystème Siku. Chaque ressource garde un
`ci.yml` minimal dont les jobs appellent les actions de ce dépôt : la logique
et les scripts vivent ici, une correction se fait une fois et vaut partout.

## Actions

| Action | Rôle |
| --- | --- |
| `siku-project/siku_ci/actions/lua-syntax@v1` | Compile chaque fichier Lua de la ressource avec Lua 5.4. |
| `siku-project/siku_ci/actions/manifest@v1` | Vérifie que `fxmanifest.lua` déclare exactement les fichiers Lua suivis, sans double chargement. |
| `siku-project/siku_ci/actions/web-checks@v1` | Formatage, types, lints et build de la NUI (`directory`, défaut `web` ; `locales: 'true'` active la parité translations Lua ↔ mock NUI ; `framework`, `vue` par défaut ou `svelte`, choisit le vérificateur de types : `vue-tsc` ou `svelte-check`). |
| `siku-project/siku_ci/actions/branch-guard@v1` | `main` n'accepte que les pull requests venant de `dev`, et `dev` n'est jamais mis à jour depuis `main`. |

## Utilisation

```yaml
name: CI

on:
  pull_request:
    branches: [dev, main]
  push:
    branches: ['**']
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  syntax:
    name: syntax
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: siku-project/siku_ci/actions/lua-syntax@v1

  manifest:
    name: manifest
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: siku-project/siku_ci/actions/manifest@v1

  web:
    name: web
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: siku-project/siku_ci/actions/web-checks@v1

  guard:
    name: guard
    runs-on: ubuntu-latest
    steps:
      - uses: siku-project/siku_ci/actions/branch-guard@v1
```

Le job `web` ne s'ajoute que dans les ressources qui ont une NUI. Une NUI
Svelte passe `framework: svelte` à l'action ; le projet fournit alors
`svelte-check`, `prettier-plugin-svelte` et `eslint-plugin-svelte`, les
commandes `prettier`, `oxlint`, `eslint` et `vite build` restant les mêmes.
Les noms de jobs (`syntax`, `manifest`, `web`, `guard`) sont ceux qu'exigent
les protections de branches : ne pas les renommer.

## Versionnement

Les ressources épinglent `@v1`. Une évolution compatible se publie en
déplaçant le tag `v1` ; une évolution qui casse se publie sous `v2` et se
propage dépôt par dépôt.
