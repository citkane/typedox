cwd := $(CURDIR)
built := false

define path-join
	$(shell node -e "console.log(path.join('$(shell echo $1 | xargs)','$(shell echo $2 | xargs)'))")
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

groomNpmPackage := $(call path, './scripts/groomNpmPackage.mjs')

initBuild:
	@if [ -f doxisbuilding ]; then \
		rm doxisbuilding; \
	else \
		touch doxisbuilding; \
		make build; \
		make buildTestFactory; \
		make buildTests; \
	fi

build:
	npx tsc -b -v
	make postBuild

buildWatch:
	npx tsc -b -w
	make postBuild

buildAllTests: build buildTestFactory buildTests

buildTestFactory:
	npx tsc -b -v $(call path, './test/src/tsconfig.json')

buildTests:
	npx tsc -b -v $(call path, './test/tsconfig.json')
	
buildTestsWatch:
	npx tsc -b -w $(call path, './test/tsconfig.json')

postBuild:
	@chmod +x $(call path, './dist/bin/typedox.mjs')

testAll: buildAllTests
	npm exec -c "NODE_ENV=test c8 mocha"

clean:
	rm -rf $(call path, 'dist')
	rm -rf $(call path, 'test/dist')
	rm -rf $(call path, 'test/runners')
	rm -rf $(call path, 'test/coverage')
	cd $(call path, 'packages/core') && make clean
	cd $(call path, 'packages/logger') && make clean
	cd $(call path, 'packages/wrapper') && make clean
	cd $(call path, 'packages/serialiser') && make clean

cleanInstall: clean
	rm -rf $(call path, 'node_modules')
	rm -rf $(call path, 'package-lock.json')

postinstall:
	@echo postinstall

prepack:
	@cp $(call path, package.json) $(call path, _package.json)
	@cp $(call path, packages/core/package.json) $(call path, packages/core/_package.json)
	@cp $(call path, packages/logger/package.json) $(call path, packages/logger/_package.json)
	@cp $(call path, packages/serialiser/package.json) $(call path, packages/serialiser/_package.json)
	@cp $(call path, packages/wrapper/package.json) $(call path, packages/wrapper/_package.json)
	@node ${groomNpmPackage} $(call path, package.json)
	@node ${groomNpmPackage} $(call path, packages/core/package.json)
	@node ${groomNpmPackage} $(call path, packages/logger/package.json)
	@node ${groomNpmPackage} $(call path, packages/serialiser/package.json)
	@node ${groomNpmPackage} $(call path, packages/wrapper/package.json)

postpack:
	@rm -f doxisbuilding
	@mv $(call path, _package.json) $(call path, package.json)
	@mv $(call path, packages/core/_package.json) $(call path, packages/core/package.json)
	@mv $(call path, packages/logger/_package.json) $(call path, packages/logger/package.json)
	@mv $(call path, packages/serialiser/_package.json) $(call path, packages/serialiser/package.json)
	@mv $(call path, packages/wrapper/_package.json) $(call path, packages/wrapper/package.json)

getGroomPackage:
	@echo ${groomNpmPackage}