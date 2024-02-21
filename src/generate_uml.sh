#!/usr/bin/env bash
# Gets latest plantuml
rm -f plantuml.jar
wget --no-verbose https://downloads.sourceforge.net/project/plantuml/plantuml.jar
# echo the version
echo "PlantUML version: $(java -jar plantuml.jar -version)"
echo "tplant version: $(npx tplant --version)"
# Builds metamodel plantuml from TypeScript sources
npx tplant -i src/lib/famix/**/*.ts -o doc-metamodel/famix-typescript-model.puml
sed -i 's/@startuml/& metamodel/' doc-metamodel/famix-typescript-model.puml
# Converts plantuml source to SVG image
java -jar plantuml.jar -v -tsvg doc-metamodel/famix-typescript-model.puml
mv doc-metamodel/metamodel.svg doc-metamodel/metamodel-full.svg
# Inserts include line to customize the file
sed -i '/@startuml metamodel/a !include skins.include.puml' doc-metamodel/famix-typescript-model.puml
# Converts plantuml source to SVG image
java -jar plantuml.jar -v -tsvg doc-metamodel/famix-typescript-model.puml
# Moves artifacts
rm -f doc-uml/*
mv doc-metamodel/*.svg doc-uml
