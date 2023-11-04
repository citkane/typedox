cwd := $(CURDIR)

define path-join
	$(shell node -e "console.log(path.join('$(shell echo $1 | xargs)','$(shell echo $2 | xargs)'))")
endef
define path
	$(call path-join, '${cwd}', $1)
endef

docData := $(shell echo $(call path, '../docs/data') | xargs)
thisData := $(shell echo $(call path, './data') | xargs)
tsconfig := $(shell echo $(call path, './src/tsconfig.json') | xargs)

build: css linkData
	npx tsc -b -v ${tsconfig}
css:
	npx sass src/css/index.scss:assets/css/index.css --style compressed

cssWatch:
	npx sass src/css/index.scss:assets/css/index.css --watch

linkData:
#	@if [ -d ${docData} ]; then \
#		ln -sf ${docData} ${thisData}; \
#	fi

buildWatch: cssWatch linkData
	npx tsc -b -w ${tsconfig}

clean:
	rm -rf $(call path, './assets')

