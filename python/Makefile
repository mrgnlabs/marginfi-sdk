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
	poetry run pytest --cov --cov-report=html:coverage_html_report -s

serve-cov:   ## Serve coverage HTML report
	python -m http.server -d coverage_html_report --bind 127.0.0.1

##@ Type-checking / Linting
lint:  ## Run type and format checkers
	make lint-code
	# make lint-docs

lint-code:
	poetry run mypy src
	poetry run black --check --preview --diff src tests
	poetry run flake8 src tests
	poetry run pylint --rcfile=.pylintrc src
	poetry run isort --check-only src

lint-docs:
	poetry run pydocstyle src

lint-tests:
	poetry run pydocstyle tests

format:
	poetry run black --preview .
	poetry run isort src tests

##@ Publishing
publish:  ## Publish to pypi
	make clean
	poetry build
	poetry publish

test-publish:  ## Publish to testpypi
	make clean
	poetry build
	poetry publish -r testpypi

##@ Documentation
generate-doc:   ## Serve doc locally
	cd docs && sphinx-apidoc -f -o source ../src/marginpy ../src/marginpy/generated_client --separate --force && make html

serve-doc:   ## Serve doc locally
	python -m http.server -d docs/build/html --bind 127.0.0.1
