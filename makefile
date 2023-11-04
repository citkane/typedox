cwd := $(CURDIR)
built := false
buildWatchText := \033kbuild:watch\033\\\033]2;build:watch\007
buildWatchTestText := \033kbuild:watch:test\033\\\033]2;build:watch:test\007
TerminalText := \033kTerminal\033\\\033]2;Terminal\007
windows := Windows_NT

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
define shellTitle
$(shell echo -e '\033k'$1'\033\\'; echo -e '\033]2;'$1'\007')
endef


groomNpmPackage := $(call path, './scripts/groomNpmPackage.mjs')

initBuild:
ifeq ($(OS),Windows_NT)
	@-type nul > initBuild
else
	@-touch $(call path, 'initBuild')
endif
	@-make build

finishedBuild:
ifeq ($(OS),Windows_NT)
	-del $(call path, 'initBuild')
else
	rm -rf $(call path, 'initBuild')
endif

build:
	npx tsc -b -v
	cd $(call path, 'packages/frontend') && make css
	make postBuild

buildWatch:
	@echo -e '${buildWatchText}'
	npx tsc -b -w

preDocBuild:
#	mkdir -p $(call path, 'docs/assets/core')
#	cp -f $(call path, 'packages/core/dist/indexFrontend.mjs') $(call path, 'docs/assets/core/indexFrontend.mjs')
#	rm -rf $(call path, './packages/frontend/assets/core')
#	rm -f $(call path, './packages/frontend/assets/js/_doxMenu.js')

postDocBuild:
#	mkdir -p $(call path, './packages/frontend/assets/core')
#	ln -s $(call path, 'docs/assets/core/indexFrontend.mjs') $(call path, './packages/frontend/assets/core/indexFrontend.mjs')
#	ln -s $(call path, './docs/assets/js/_doxMenu.js') $(call path, './packages/frontend/assets/js/_doxMenu.js')

buildDocs: preDocBuild
	npx typedox
	make postDocBuild

buildDocsVerbose: preDocBuild
	npx typedox --logLevel debug
	make postDocBuild

terminal:
	@echo -e '${TerminalText}';

buildAllTests: build buildTestFactory buildTests

buildTestFactory:
	npx tsc -b -v $(call path, './test/src/tsconfig.json')

buildTests:
	npx tsc -b -v $(call path, './test/tsconfig.json')
	
buildTestsWatch:
	@echo -e '${buildWatchTestText}'
	npx tsc -b -w $(call path, './test/tsconfig.json')

postBuild:
	@-chmod +x $(call path, './dist/bin/typedox.mjs')

testAll: buildAllTests
	npm exec -c "NODE_ENV=test c8 mocha"

clean: finishedBuild
ifeq ($(OS),Windows_NT)
	-rmdir /s/q $(call path, 'dist')
	-rmdir /s/q $(call path,'test/dist' )
	-rmdir /s/q $(call path, 'test/runners')
	-rmdir /s/q $(call path,'test/coverage' )
else
	-rm -rf $(call path, 'dist')
	-rm -rf $(call path, 'test/dist')
	-rm -rf $(call path, 'test/runners')
	-rm -rf $(call path, 'test/coverage')
endif
	-cd $(call path, 'packages/core') && make clean
	-cd $(call path, 'packages/backend/logger') && make clean
	-cd $(call path, 'packages/backend/wrapper') && make clean
	-cd $(call path, 'packages/backend/serialiser') && make clean
	-cd $(call path, 'packages/backend/fileManager') && make clean
	-cd $(call path, 'packages/frontend') && make clean


cleanInstall: clean
ifeq ($(OS),Windows_NT)
	-rmdir /s/q $(call path, 'node_modules')
	-del $(call path, 'package-lock.json')
else
	-rm -rf $(call path, 'node_modules')
	-rm -rf $(call path, 'package-lock.json')
endif

prepack:
	@cp $(call path, package.json) $(call path, _package.json)
	@cp $(call path, packages/core/package.json) $(call path, packages/core/_package.json)
	@cp $(call path, packages/backend/logger/package.json) $(call path, packages/backend/logger/_package.json)
	@cp $(call path, packages/backend/serialiser/package.json) $(call path, packages/backend/serialiser/_package.json)
	@cp $(call path, packages/backend/wrapper/package.json) $(call path, packages/backend/wrapper/_package.json)
	@cp $(call path, packages/backend/fileManager/package.json) $(call path, packages/backend/fileManager/_package.json)
	@cp $(call path, packages/frontend/package.json) $(call path, packages/frontend/_package.json)
	@node ${groomNpmPackage} $(call path, package.json)
	@node ${groomNpmPackage} $(call path, packages/core/package.json)
	@node ${groomNpmPackage} $(call path, packages/backend/logger/package.json)
	@node ${groomNpmPackage} $(call path, packages/backend/serialiser/package.json)
	@node ${groomNpmPackage} $(call path, packages/backend/wrapper/package.json)
	@node ${groomNpmPackage} $(call path, packages/backend/fileManager/package.json)
	@node ${groomNpmPackage} $(call path, packages/frontend/package.json)

postpack:
	@mv $(call path, _package.json) $(call path, package.json)
	@mv $(call path, packages/core/_package.json) $(call path, packages/core/package.json)
	@mv $(call path, packages/backend/logger/_package.json) $(call path, packages/backend/logger/package.json)
	@mv $(call path, packages/backend/serialiser/_package.json) $(call path, packages/backend/serialiser/package.json)
	@mv $(call path, packages/backend/wrapper/_package.json) $(call path, packages/backend/wrapper/package.json)
	@mv $(call path, packages/backend/fileManager/_package.json) $(call path, packages/backend/fileManager/package.json)
	@mv $(call path, packages/frontend/_package.json) $(call path, packages/frontend/package.json)

getGroomPackage:
	@echo ${groomNpmPackage}