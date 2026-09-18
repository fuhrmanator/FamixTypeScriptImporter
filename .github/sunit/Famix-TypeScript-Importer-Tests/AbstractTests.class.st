Class {
	#name : 'AbstractTests',
	#superclass : 'TestCase',
	#instVars : [
		'model',
		'theClass'
	],
	#category : 'Famix-TypeScript-Importer-Tests',
	#package : 'Famix-TypeScript-Importer-Tests'
}

{ #category : 'running' }
AbstractTests >> setUp [ 
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
					            'src/abstracts/abstracts.ts' ] ].
]

{ #category : 'tests' }
AbstractTests >> testContainsAbstractClass [ [

	self assert: theClass isNotNil.
	self assert: theClass isAbstract
]
]

{ #category : 'tests' }
AbstractTests >> testContainsAbstractMethods [ 
	| abstractMethod1 abstractmethod2 concreteMethod |
	
	self assert: theClass methods size equals: 3.

	abstractMethod1 := theClass methods detect: [ :each | each name = 'abstractMethod1' ] ifNone: [ nil ].
	abstractmethod2 := theClass methods detect: [ :each | each name = 'abstractMethod2' ] ifNone: [ nil ].
	concreteMethod := theClass methods detect: [ :each | each name = 'concreteMethod' ] ifNone: [ nil ].

	self assert: abstractMethod1 isNotNil.
	self assert: abstractMethod1 isAbstract.
	
	self assert: abstractmethod2 isNotNil.
	self assert: abstractmethod2 isAbstract.
	
	self assert: concreteMethod isNotNil.
	self deny: concreteMethod isAbstract.
]
