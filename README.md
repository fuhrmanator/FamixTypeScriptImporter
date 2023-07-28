# FamixTypeScriptImporter

[![Node.js CI](https://github.com/fuhrmanator/FamixTypeScriptImporter/actions/workflows/node.js.yml/badge.svg)](https://github.com/fuhrmanator/FamixTypeScriptImporter/actions/workflows/node.js.yml)

Create a [FamixTypeScript](https://github.com/fuhrmanator/FamixTypeScript) model in JSON of TypeScript files.

## Installation

```
npm install
```

```
npm install -g ts-node
```

## Usage

Instructions for using the command-line importer:

```
ts-node src/ts2famix-cli.ts --help
```

## Generate an object diagram of the JSON model

```
ts-node src/famix2puml.ts -i JSONModels/ModelName.json -o ModelName.puml
```

## Import the JSON into Moose 🫎

```st
'.\JSONModels\TypeScriptModel.json' asFileReference readStreamDo:
[ :stream | model := FamixTypeScriptModel new importFromJSONStream: stream. model install ].
```

## TypeScript Metamodel API documentation (visualization)

The following was generated by CI using [tplant](https://github.com/bafolts/tplant), in a similar fashion described [here](https://modularmoose.org/2021/07/19/automatic-metamodel-documentation-generation.html).

![FamixTypeScript API Metamodel](https://raw.githubusercontent.com/fuhrmanator/FamixTypeScriptImporter/v1/doc/famix-typescript-model.svg)
