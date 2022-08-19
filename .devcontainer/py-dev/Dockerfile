FROM mrgnlabs/solana-dev:0.0.2-alpha

# Python 3.10 from source
WORKDIR /py
RUN apt-get update && apt-get upgrade -y
RUN apt-get install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget libbz2-dev -y
RUN wget https://www.python.org/ftp/python/3.10.0/Python-3.10.0.tgz
RUN tar -xf Python-3.10.0.tgz
WORKDIR /py/Python-3.10.0
RUN ./configure --enable-optimizations
RUN make build_all -j 7
RUN make altinstall
RUN ln -s /usr/local/bin/python3.10 /usr/local/bin/python
RUN ln -s /usr/local/bin/python3.10 /usr/local/bin/python3

# Poetry (python package development tool)
ENV PYTHONPATH=${PYTHONPATH}:${PWD} 
RUN python3 -m pip install poetry nox-poetry
# RUN python3 -m poetry env use 3.10
# RUN poetry install
# RUN poetry shell

# # Maturin (rust)
# RUN maturin develop
