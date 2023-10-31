cwd := $(CURDIR)

define path-join
	$(shell node -e "console.log(path.join('$(shell echo $1 | xargs)','$(shell echo $2 | xargs)'))")
endef
define path
	$(call path-join, '${cwd}', $1)
endef

tsconfig := $(call path, './src/tsconfig.json')

build:
	npx tsc -b -v ${tsconfig}

buildWatch:
	npx tsc -b -w ${tsconfig}

clean:
	rm -rf $(call path, './assets/js')
	rm -rf $(call path, './assets/css')

