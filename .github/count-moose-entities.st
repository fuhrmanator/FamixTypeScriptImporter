| counts json |

counts := Dictionary new.


"Modules / source files"
counts
    at: 'modules'
    put: model allSourceFiles size.


"Classes"
counts
    at: 'classes'
    put: (model allWithType: FamixTypeScriptClass) size.


"Interfaces"
counts
    at: 'interfaces'
    put: (model allWithType: FamixTypeScriptInterface) size.


"Methods"
counts
    at: 'methods'
    put: (model allWithType: FamixTypeScriptMethod) size.


"Functions"
counts
    at: 'functions'
    put: (model allWithType: FamixTypeScriptFunction) size.


"Accesses"
counts
    at: 'accesses'
    put: (model allWithType: FamixTypeScriptAccess) size.


"Invocations"
counts
    at: 'invocations'
    put: (model allWithType: FamixTypeScriptInvocation) size.


"Inheritance relationships"
counts
    at: 'inheritances'
    put: (model allWithType: FamixTypeScriptInheritance) size.


"Interface implementations"
counts
    at: 'concretisations'
    put: (model allWithType: FamixTypeScriptConcretisation) size.


"Imports"
counts
    at: 'imports'
    put: (model allWithType: FamixTypeScriptImport) size.


"Exports"
counts
    at: 'exports'
    put: (model allWithType: FamixTypeScriptExport) size.



json := NeoJSONWriter toString: counts.


(FileLocator workingDirectory / 'moose-counts.json')
    writeStreamDo: [ :stream |
        stream nextPutAll: json ].


Transcript
    show: 'Moose entity counts exported';
    cr.