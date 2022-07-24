.PHONY: help

##@ Utility
help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

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
	poetry run black --preview --check .

format:  ## Format workspace code
	poetry run black --preview .

##@ Documentation
generate-doc:   ## Serve doc locally
	cd docs && sphinx-apidoc -f -o source ../src/marginpy ../src/marginpy/generated_client --separate --force && make html

serve-doc:   ## Serve doc locally
	python -m http.server -d docs/build/html --bind 127.0.0.1
