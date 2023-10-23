define path-join
	$(shell node -e "console.log(path.join($1,$2))")
endef

cwd := $(CURDIR)
typedox := $(call path-join, '${cwd}', '../../')

build:
	@cd ${typedox}; \
	npm run build

buildWatch:
	@cd ${typedox}; \
	npm run build:watch


