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

prunePackage.js := $(call path, './scripts/prunePackage.js')

build: buildRoot

buildRoot: prunePackages
	@npx tsc -b

buildWatch: prunePackages
	@npx tsc -b -w

prunePackages: copyDistPackages
	@node ${prunePackage.js} $(call path, './dist/package.json') true
	@node ${prunePackage.js} $(call path, './dist/backend/package.json')

copyDistPackages:
	@mkdir -p $(call path, './dist/backend')
	@$(call copy, './package.json', './dist')
	@$(call copy, './packages/backend/package.json', './dist/backend')

testAll: buildRoot
	npm exec -c "NODE_ENV=test c8 mocha"

testBackend: buildRoot
	npm exec -c "NODE_ENV=test mocha --spec ./test/runners/tests.backend.spec.mjs"

testBackendCoverage: buildRoot
	npm exec -c "NODE_ENV=test c8 mocha --spec ./test/runners/tests.backend.spec.mjs"