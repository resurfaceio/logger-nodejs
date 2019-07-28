# Contributing

## Coding Conventions

Our code style is whatever WebStorm does by default, with the exception of allowing lines up to 130 characters.
If you don't use WebStorm, that's ok, but your code may get reformatted.

## Git Workflow

```
git clone git@github.com:resurfaceio/logger-nodejs.git resurfaceio-logger-nodejs
cd resurfaceio-logger-nodejs
npm install
```

Running unit tests:

```
npm test
```

Committing changes:

```
git add -A
git commit -m "#123 Updated readme"       (123 is the GitHub issue number)
git pull --rebase                         (avoid merge bubbles)
git push origin master
```

## Release Process

All [integration tests](https://github.com/resurfaceio/logger-tests) must pass first.

Push artifacts to [npmjs.com](https://npmjs.com/):

```
npm publish .
```

Tag release version:

```
git tag v1.x.x
git push origin master --tags
```

Start the next version by incrementing the version number.
