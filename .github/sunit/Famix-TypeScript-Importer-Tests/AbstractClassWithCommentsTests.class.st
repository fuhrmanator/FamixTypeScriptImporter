Class {
	#name : 'AbstractClassWithCommentsTests',
	#superclass : 'TestCase',
	#instVars : [
		'model',
		'theClass'
	],
	#category : 'Famix-TypeScript-Importer-Tests',
	#package : 'Famix-TypeScript-Importer-Tests'
}

{ #category : 'running' }
AbstractClassWithCommentsTests >> setUp [ 
	| file modelPath candidateClasses |
	super setUp.
	
    modelPath := OSEnvironment current 
        at: 'MODEL_JSON_PATH' 
        ifAbsent: [ nil ].

    file := modelPath asFileReference.
	
	self assert: file exists description: 'The Json file is missing'.
	
	file readStreamDo: [ :stream |
		model := FamixTypeScriptModel new importFromJSONStream: stream
	].

	
	"Finding the Abstract Class"
	candidateClasses := (model allWithSubTypesOf: FamixTypeScriptClass) select: [ :each |
		  each name = 'MyAbstractClass' ].
	
	theClass := candidateClasses
		            detect: [ :each |
			            | fileName |
			            fileName := each sourceAnchor ifNotNil: [ :anchor |
				                        anchor fileName ].
			            fileName notNil and: [
				            fileName endsWith:
					            'src/abstractClassWithComments/abstractClassWithComments.ts' ] ].
]

{ #category : 'tests' }
AbstractClassWithCommentsTests >> testClassHasTwoComments [

	| comments |
	self assert: theClass isNotNil.

	comments := theClass comments.
	self assert: comments size equals: 2.
]

{ #category : 'tests' }
AbstractClassWithCommentsTests >> testContainsAbstractClass [ [

	self assert: theClass isNotNil.
	self assert: theClass isAbstract
]
]
