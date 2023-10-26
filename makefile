cwd := $(CURDIR)

define path-join
	$(shell node -e "console.log(path.join($1,$2))")
endef
define path
	$(call path-join, '${cwd}', $1)
endef
define copy
	cp $(call path, $1) $(call path, $2)
endef
define copyDir
	cp -r $(call path, $1) $(call path, $2)
endef

groomNpmPackage.js := $(call path, './scripts/groomNpmPackage.js')

build: buildRoot

buildRoot: groomNpmPackage
	npx tsc -b
	@make postBuild

buildWatch: groomNpmPackage buildRoot
	@make postBuild
	npx tsc -b -w
	
postBuild:
	@chmod +x $(call path, './dist/bin/typedox.mjs')
	npm --silent i -D $(call path, './dist')

groomNpmPackage: copyDistPackages
	@node ${groomNpmPackage.js} $(call path, './dist/package.json') true
	@node ${groomNpmPackage.js} $(call path, './dist/backend/package.json')

copyDistPackages:
	@mkdir -p $(call path, './dist/backend')
	@$(call copy, './package.json', './dist')
	@$(call copy, './packages/backend/package.json', './dist/backend')

testAll: buildRoot
	npm exec -c "NODE_ENV=test c8 mocha"

testBackend:
	npm exec -c "NODE_ENV=test mocha --spec ./test/runners/tests.backend.spec.mjs"

testBackendCoverage:
	npm exec -c "NODE_ENV=test c8 mocha --spec ./test/runners/tests.backend.spec.mjs"