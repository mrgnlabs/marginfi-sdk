.PHONY: help

##@ Utility
help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@#egrep '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

##@ Testing
test:  ## Run all tests
	poetry run pytest -vv -s

test-unit:  ## Run unit tests
	poetry run pytest -vv -m unit

test-integration:  ## Run integration tests
	poetry run pytest -vv -m integration -s # option to prevent capturing output required, or test validator process will not be cleaned up

test-localnet:  ## Run localnet tests
	poetry run pytest -vv -m localnet -s # option to prevent capturing output required, or test validator process will not be cleaned up

test-devnet:  ## Run devnet tests
	poetry run pytest -vv -m devnet

test-cov:  ## Generate coverage report
	poetry run pytest --cov -s

##@ Type-checking / Linting
check:  ## Run type-checkers adn linters
	poetry run mypy src tests
	poetry run flake8

format:  ## Format workspace code
	black .

##@ Documentation
generak-doc:   ## Serve doc locally
	cd docs && sphinx-apidoc -f -o source ../src/marginpy && make html

serve-doc:   ## Serve doc locally
	python -m http.server -d docs/build/html --bind 127.0.0.1

# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD   ?= sphinx-build
SOURCEDIR     = docs
BUILDDIR      = docs/_build

help-doc:   ## Display Sphinx help
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.DEFAULT_GOAL := help