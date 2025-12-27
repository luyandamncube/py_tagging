## Pyenv (OPTIONAL)

```bash
# install via choco
choco install pyenv-win -y
pyenv --version

# install python w/ pyenv
pyenv install --list
pyenv install 3.10.0
pyenv global 3.10.0

# setup python 3.10 pyenv
pyenv local 3.10.0
python -m venv venv
.\venv\Scripts\Activate.ps1
where.exe python

# install dependencies
pip install --upgrade pippip install --upgrade pip
pip install -r requirements.txt

```

## pyenv linux

```bash
python3 -m venv .venv
source .venv/bin/activate
 
```

## node

```bash
sudo apt update
sudo apt install -y nodejs npm

```