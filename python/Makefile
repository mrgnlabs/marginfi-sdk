##@ Utility
help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

clean:
	rm -rf dist build __pycache__ *.egg-info

##@ Testing
test:  ## Run all tests
	poetry run pytest -vv -s # option to prevent capturing output required, or test validator process will not be cleaned up

test-unit:  ## Run unit tests
	poetry run pytest -vv -m unit

test-integration:  ## Run integration tests
	poetry run pytest -vv -m integration -s # option to prevent capturing output required, or test validator process will not be cleaned up

test-localnet:  ## Run localnet tests
	poetry run pytest -vv -m localnet -s # option to prevent capturing output required, or test validator process will not be cleaned up

test-devnet:  ## Run devnet tests
	poetry run pytest -vv -m devnet

coverage:  ## Generate coverage report
	poetry run pytest --cov --cov-report=html -s

serve-cov:   ## Serve coverage HTML report
	python -m http.server -d htmlcov --bind 127.0.0.1

##@ Type-checking / Linting
lint:  ## Run type and format checkers
	make lint-code

lint-code:
	poetry run mypy python examples
	poetry run black --check --preview --diff python tests examples
	poetry run flake8 python tests examples
	poetry run pylint --rcfile=.pylintrc python/marginpy examples
	poetry run isort --check-only python examples

lint-docs:
	poetry run pydocstyle python tests

format:
	poetry run black --preview .
	poetry run isort python examples tests

build:  ## Build
	make clean
	poetry run maturin build

# ##@ Publishing
build-and-publish:  ## Publish to pypi
	make clean
	poetry run maturin build
	poetry run maturin publish

build-and-test-publish:  ## Publish to testpypi
	make clean
	poetry run maturin build
	poetry run maturin publish -r testpypi

##@ Documentation
generate-doc:   ## Serve doc locally
	cd docs && sphinx-apidoc -f -o source ../python/marginpy ../python/marginpy/generated_client --separate --force && make html

serve-doc:   ## Serve doc locally
	python -m http.server -d docs/build/html --bind 127.0.0.1
