cwd := $(CURDIR)

define path-join
	$(shell node -e "console.log(path.join($1,$2))")
endef
define path
	$(call path-join, '${cwd}', $1)
endef

dist := $(call path, '../../dist/logger')
tsconfig := $(call path, './tsconfig.json')

build: prebuild
	npx tsc -b -v ${tsconfig}

buildWatch: prebuild
	npx tsc -b -w ${tsconfig}

prebuild:
	@mkdir -p ${dist}
	@cp $(call path, './package.json') ${dist}
	@node ${groomNpmPackage.mjs} $(call path-join, ${dist}, './package.json')

clean:
	rm -rf $(call path, './dist')
