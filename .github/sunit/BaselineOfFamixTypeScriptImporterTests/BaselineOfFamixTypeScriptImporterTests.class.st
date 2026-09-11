Class {
	#name : 'BaselineOfFamixTypeScriptImporterTests',
	#superclass : 'BaselineOf',
	#category : 'BaselineOfFamixTypeScriptImporterTests',
	#package : 'BaselineOfFamixTypeScriptImporterTests'
}

{ #category : 'baselines' }
BaselineOfFamixTypeScriptImporterTests >> baseline: spec [
    <baseline>
    spec
    for: #common
    do: [
        self defineDependencies: spec.
        self definePackages: spec.
        self defineGroups: spec ]
]

{ #category : 'dependencies' }
BaselineOfFamixTypeScriptImporterTests >> defineDependencies: spec [
    spec
        baseline: 'FamixTypeScript'
        with: [ spec
            repository: 'github://fuhrmanator/FamixTypeScript:master/src' ].
]

{ #category : 'groups' }
BaselineOfFamixTypeScriptImporterTests >> defineGroups: spec [
    
]

{ #category : 'packages' }
BaselineOfFamixTypeScriptImporterTests >> definePackages: spec [
    spec
        package: 'Famix-TypeScript-Importer-Tests'.
]
