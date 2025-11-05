# Cloud-Based SDN Management Dashboard Simulation

A comprehensive Software-Defined Networking (SDN) management dashboard built on OMNeT++ that provides interactive control and visualization for network slicing and dynamic flow provisioning in cloud environments.

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation Guide](#installation-guide)
4. [Environment Configuration](#environment-configuration)
5. [Project Structure](#project-structure)
6. [Running the Project](#running-the-project)
7. [Development Workflow](#development-workflow)
8. [Common Commands Reference](#common-commands-reference)
9. [Troubleshooting](#troubleshooting)
10. [Verification Checklist](#verification-checklist)

---

## Overview

This project implements a modular, experiment-driven dashboard for managing SDN abstractions in cloud environments. Key features include:

- **Network Slicing**: Create, delete, and configure virtual networks on shared cloud topology
- **Dynamic Flow Provisioning**: Add and remove OpenFlow rules interactively for on-demand connections
- **Real-time Visualization**: Live monitoring of network topology, flows, and statistics
- **OMNeT++ Integration**: Full integration with OMNeT++ discrete event simulator and INET framework

### Architecture

- **Simulation Layer**: OMNeT++ with INET framework and SDN modules
- **Controller Layer**: OpenFlow-based SDN controller
- **Communication Bridge**: WebSocket/REST API for simulation-dashboard communication
- **Dashboard Backend**: Node.js/Express server with real-time updates
- **Dashboard Frontend**: React-based web interface with D3.js visualizations

---

## System Requirements

### Operating System

- **macOS**: 10.15 (Catalina) or later
  - Apple Silicon (M1/M2/M3) or Intel processors supported
- **Linux**: Ubuntu 20.04+, Fedora 33+, or equivalent
- **Windows**: Windows 10/11 with WSL2 recommended

### Hardware

- **CPU**: Multi-core processor (4+ cores recommended)
- **RAM**: Minimum 8GB, 16GB+ recommended
- **Disk Space**: At least 5GB free space for installation

### Software Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| **Homebrew** | Latest | Package manager (macOS) |
| **Node.js** | v22.0+ | JavaScript runtime |
| **npm** | v11.0+ | Package manager |
| **Python 3** | 3.10+ | Build scripts (optional) |
| **GCC/Clang** | Latest | C++ compiler |
| **Make** | Latest | Build automation |
| **Qt5** | 5.15+ | GUI framework |
| **Bison** | Latest | Parser generator |
| **Flex** | Latest | Lexical analyzer |
| **pkg-config** | Latest | Build configuration |

---

## Installation Guide

### Step 1: Install System Dependencies

#### macOS (using Homebrew)

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required packages
brew install qt@5 bison flex pkg-config make

# Install Node.js and npm
brew install node

# Verify installations
node --version  # Should be v22.0+
npm --version   # Should be v11.0+
```

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install build tools
sudo apt install build-essential gcc g++ make

# Install Qt5
sudo apt install qt5-default qttools5-dev-tools

# Install other dependencies
sudo apt install bison flex pkg-config

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version
npm --version
```

### Step 2: OMNeT++ Installation

#### Download and Extract OMNeT++

This project already contains OMNeT++ 7.0.0pre2 source code. If you need to download it separately:

```bash
# Clone or download OMNeT++ (if not already present)
# The source is already included in this repository at the root level
cd /path/to/Cloud-Based-SDN-Management-Dashboard-Simulation
```

#### Configure OMNeT++

1. **Create configure.user file** (if it doesn't exist):

```bash
cp configure.user.dist configure.user
```

2. **Edit configure.user** to disable Python and OSG support (simplifies build):

Open `configure.user` in your editor and modify these lines:

```bash
# Change these settings:
WITH_PYTHON=no
WITH_SCAVE_PYTHON_BINDINGS=no
WITH_OSG=no
WITH_OSGEARTH=no
```

3. **Fix the hypot compilation error** (known issue with modern C++ compilers):

Open `src/common/exprnodes.cc` and find line 104. Change:

```cpp
// FROM:
if (name == "hypot") return createMathFunction("hypot", hypot);

// TO:
if (name == "hypot") return createMathFunction("hypot", static_cast<double(*)(double,double)>(hypot));
```

4. **Source the environment and configure**:

```bash
# Source the OMNeT++ environment
source setenv

# Run configure script
./configure
```

The configure script will:
- Detect your compiler (Clang on macOS, GCC on Linux)
- Check for Qt5 and other dependencies
- Generate Makefile.inc
- Display any warnings (Python/numpy warnings are safe to ignore)

#### Build OMNeT++

```bash
# Build OMNeT++ in release mode with 4 parallel jobs
# This will take 5-10 minutes depending on your system
make MODE=release -j4
```

**Note**: You may see warnings like `install_name_tool: changing install names or rpaths can't be redone`. These are safe to ignore.

#### Verify OMNeT++ Installation

```bash
# Check if binaries were created
ls -la bin/

# Test opp_run command
source setenv
opp_run -h
```

You should see the OMNeT++ help message with version information.

### Step 3: INET Framework Setup

The INET framework provides protocol implementations for network simulations.

#### Clone INET Repository

```bash
# Navigate to parent directory
cd /path/to/Cloud-Based-SDN-Management-Dashboard-Simulation/..

# Clone INET framework
git clone https://github.com/inet-framework/inet.git

# Enter INET directory
cd inet

# Checkout stable version 4.5.2
git checkout v4.5.2
```

#### Build INET Framework

```bash
# Source both OMNeT++ and INET environments
source ../Cloud-Based-SDN-Management-Dashboard-Simulation/setenv
source setenv

# Generate makefiles
make makefiles

# Build INET in release mode (takes 10-15 minutes)
make MODE=release -j4
```

#### Verify INET Build

```bash
# Check if the library was created
ls -lh out/clang-release/src/libINET.dylib  # macOS
# OR
ls -lh out/gcc-release/src/libINET.so       # Linux

# The file should be around 40-50 MB
```

### Step 4: Project Structure Setup

The project structure is already created. If you need to recreate it:

```bash
cd /path/to/Cloud-Based-SDN-Management-Dashboard-Simulation

# Create directory structure
mkdir -p sdn_dashboard/{simulations,src,dashboard}
mkdir -p sdn_dashboard/simulations/{networks,results}
mkdir -p sdn_dashboard/src/{controller,bridge,utils}
mkdir -p sdn_dashboard/dashboard/{backend,frontend}
mkdir -p sdn_dashboard/dashboard/backend/{api,websocket}
mkdir -p sdn_dashboard/dashboard/frontend/{src,public}
mkdir -p sdn_dashboard/dashboard/frontend/src/{components,services,utils}
```

#### Install Backend Dependencies

```bash
cd sdn_dashboard/dashboard/backend

# Initialize package.json (if not exists)
npm init -y

# Install dependencies
npm install express ws cors body-parser
```

**Installed packages**:
- `express` (v5.1.0): Web framework
- `ws` (v8.18.3): WebSocket library
- `cors` (v2.8.5): Cross-Origin Resource Sharing
- `body-parser` (v2.2.0): Request body parsing

#### Install Frontend Dependencies

```bash
cd ../frontend

# Initialize package.json (if not exists)
npm init -y

# Create directory structure
mkdir -p src/components src/services src/utils public

# Install dependencies
npm install react react-dom react-scripts axios d3
```

**Installed packages**:
- `react` (v19.2.0): UI library
- `react-dom` (v19.2.0): React DOM bindings
- `react-scripts` (v5.0.1): React build tools
- `axios` (v1.13.2): HTTP client
- `d3` (v7.9.0): Visualization library

### Step 5: SDN Module Installation (Optional)

SDN modules provide OpenFlow switch and controller implementations. Install when you're ready to implement SDN functionality.

#### Option A: SDN4CoRE (Recommended)

```bash
cd /path/to/Cloud-Based-SDN-Management-Dashboard-Simulation/..

# Clone SDN4CoRE
git clone https://github.com/CoRE-RG/SDN4CoRE.git

cd SDN4CoRE

# Source environments
source ../Cloud-Based-SDN-Management-Dashboard-Simulation/setenv
source ../inet/setenv

# Generate makefiles
make makefiles

# Build
make MODE=release -j4
```

#### Option B: OpenFlowOMNeTSuite (Alternative)

```bash
cd /path/to/Cloud-Based-SDN-Management-Dashboard-Simulation/..

# Clone OpenFlowOMNeTSuite
git clone https://github.com/lguohan/INET-hnrl.git openflow

cd openflow

# Follow build instructions in the repository
```

---

## Environment Configuration

### Sourcing the Environment

Every time you open a new terminal and want to work with OMNeT++, you must source the environment:

```bash
cd /path/to/Cloud-Based-SDN-Management-Dashboard-Simulation
source setenv
```

This script:
- Adds OMNeT++ binaries to PATH
- Sets OMNETPP_ROOT and other environment variables
- Activates Homebrew dependencies (Qt5, bison, flex)

### Making Environment Permanent

To avoid sourcing manually every time, add to your shell profile:

#### For Zsh (macOS default)

Add to `~/.zshrc`:

```bash
# OMNeT++ Environment
export OMNETPP_ROOT="/path/to/Cloud-Based-SDN-Management-Dashboard-Simulation"
if [ -f "$OMNETPP_ROOT/setenv" ]; then
    source "$OMNETPP_ROOT/setenv" -q
fi

# INET Framework
export INET_ROOT="/path/to/inet"
if [ -f "$INET_ROOT/setenv" ]; then
    source "$INET_ROOT/setenv" -q
fi
```

#### For Bash (Linux default)

Add to `~/.bashrc`:

```bash
# OMNeT++ Environment
export OMNETPP_ROOT="/path/to/Cloud-Based-SDN-Management-Dashboard-Simulation"
if [ -f "$OMNETPP_ROOT/setenv" ]; then
    source "$OMNETPP_ROOT/setenv" -q
fi

# INET Framework
export INET_ROOT="/path/to/inet"
if [ -f "$INET_ROOT/setenv" ]; then
    source "$INET_ROOT/setenv" -q
fi
```

After adding, reload your shell:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Environment Variables

Key environment variables set by OMNeT++:

| Variable | Purpose |
|----------|---------|
| `OMNETPP_ROOT` | OMNeT++ installation directory |
| `OMNETPP_RELEASE` | OMNeT++ version string |
| `OMNETPP_IMAGE_PATH` | Path to icon images |
| `PATH` | Includes OMNeT++ bin directory |
| `PYTHONPATH` | Python module path |

---

## Project Structure

```
Cloud-Based-SDN-Management-Dashboard-Simulation/
├── bin/                          # OMNeT++ executables
│   ├── opp_run                   # Simulation runner
│   ├── opp_msgc                  # Message compiler
│   ├── nedtool                   # NED file tool
│   └── ...
├── include/                      # OMNeT++ headers
├── lib/                          # OMNeT++ libraries
├── src/                          # OMNeT++ source code
├── samples/                      # Example simulations
├── doc/                          # Documentation
├── images/                       # Icon resources
│
├── sdn_dashboard/               # Main project directory
│   ├── simulations/             # Simulation scenarios
│   │   ├── networks/            # NED topology files
│   │   └── results/             # Simulation output
│   │
│   ├── src/                     # C++ simulation code
│   │   ├── controller/          # SDN controller logic
│   │   ├── bridge/              # Dashboard-simulation bridge
│   │   └── utils/               # Utility functions
│   │
│   └── dashboard/               # Web dashboard
│       ├── backend/             # Node.js backend
│       │   ├── api/             # REST API endpoints
│       │   ├── websocket/       # WebSocket handlers
│       │   ├── package.json     # Backend dependencies
│       │   └── server.js        # Main server file
│       │
│       └── frontend/            # React frontend
│           ├── public/          # Static assets
│           ├── src/             # React components
│           │   ├── components/  # UI components
│           │   ├── services/    # API services
│           │   └── utils/       # Helper functions
│           └── package.json     # Frontend dependencies
│
├── setenv                       # Environment setup script
├── configure                    # Configuration script
├── configure.user               # User configuration
├── Makefile                     # Main makefile
├── README.md                    # This file
└── implementation.md            # Implementation guide

../inet/                         # INET framework (sibling directory)
├── src/                         # INET source code
├── examples/                    # Example networks
└── out/                         # Build output
```

### Directory Purposes

- **`sdn_dashboard/simulations/`**: Contains NED files defining network topologies and omnetpp.ini configuration files
- **`sdn_dashboard/src/`**: C++ implementation of SDN controller, OpenFlow switches, and communication bridge
- **`sdn_dashboard/dashboard/backend/`**: Node.js server handling API requests and WebSocket connections
- **`sdn_dashboard/dashboard/frontend/`**: React application providing web interface for network management

---

## Running the Project

### Running the Cloud Topology Simulation

The cloud topology simulation is the core network simulation that demonstrates a multi-tenant SDN environment with hierarchical switching architecture.

#### Quick Start

```bash
# Navigate to simulation directory
cd sdn_dashboard/simulations

# Source OMNeT++ environment
source ../../setenv

# Run simulation (1 second quick test)
opp_run_release -l ../../../inet/src/libINET.dylib \
    -u Cmdenv -c General -n .:../../../inet/src \
    --sim-time-limit=1s
```

#### Detailed Instructions

1. **Navigate to the simulation directory**:
   ```bash
   cd sdn_dashboard/simulations
   ```

2. **Set up the OMNeT++ environment**:
   ```bash
   source ../../setenv
   ```
   This loads OMNeT++ tools and sets required paths.

3. **Run the simulation**:

   **Short test run (1 second)**:
   ```bash
   opp_run_release -l ../../../inet/src/libINET.dylib \
       -u Cmdenv -c General -n .:../../../inet/src \
       --sim-time-limit=1s
   ```

   **Full simulation (1000 seconds as configured)**:
   ```bash
   opp_run_release -l ../../../inet/src/libINET.dylib \
       -u Cmdenv -c General -n .:../../../inet/src
   ```

   **Custom time limit**:
   ```bash
   opp_run_release -l ../../../inet/src/libINET.dylib \
       -u Cmdenv -c General -n .:../../../inet/src \
       --sim-time-limit=100s
   ```

#### Command Parameters Explained

- `-l ../../../inet/src/libINET.dylib` - Loads the INET framework library
- `-u Cmdenv` - Uses command-line interface (no GUI)
- `-c General` - Runs the "General" configuration from omnetpp.ini
- `-n .:../../../inet/src` - Sets NED path to find network definitions
- `--sim-time-limit=Xs` - Overrides simulation time limit

#### What to Expect

When the simulation runs, you'll see:

1. **Network Initialization**:
   - 12 hosts (host[0] through host[11])
   - 5 switches (2 core switches, 3 edge switches)
   - 1 controller node
   - Automatic IP assignment (10.0.0.x/24 addresses)

2. **Traffic Generation**:
   - Each host sends UDP packets to randomly selected destinations
   - 1000-byte messages sent at exponential intervals (average 1s)
   - Hosts start sending at random times within first 10 seconds

3. **Console Output**:
   - Interface configuration messages
   - IP address assignments
   - Network state changes
   - Progress indicators showing simulation time

**Example output**:
```
Setting up network "sdn_dashboard.simulations.networks.CloudTopology"...
Initializing...
Running simulation...
** Event #0   t=0   Elapsed: 2.4e-05s (0m 00s)    0% completed
...
[INFO] CloudTopology.host[0].ipv4: inet_addr:10.0.0.3/24
[INFO] CloudTopology.host[1].ipv4: inet_addr:10.0.0.4/24
...
```

#### Viewing Results

After simulation completes, results are saved in the `results/` directory:

```bash
ls -la results/
```

**Result files**:
- `General-#0.sca` - Scalar results (statistics, counters)
- `General-#0.vec` - Vector results (time-series data)
- `General-#0.vci` - Vector index (for faster access)

**Analyze results**:

```bash
# View scalar statistics
opp_scavetool scalar -F CSV -o output.csv results/General-#0.sca

# List available vectors
opp_scavetool vector -l results/General-#0.vec

# Export specific vector to CSV
opp_scavetool vector -F CSV -o packets.csv results/General-#0.vec
```

#### Network Topology Details

The CloudTopology network consists of:

- **3 Tenants**: Each tenant is isolated with dedicated edge switch
- **4 Hosts per tenant**: Total 12 hosts across all tenants
- **Hierarchical connectivity**:
  - Core layer: 2 core switches (10Gbps interconnect)
  - Edge layer: 3 edge switches (1Gbps to each core)
  - Access layer: Hosts connected at 100Mbps

**Topology diagram**:
```
                Controller
                    |
        +-----------+-----------+
        |                       |
    CoreSwitch1 <===========> CoreSwitch2
        |                       |
   +----+----+            +----+----+
   |    |    |            |    |    |
 Edge0 Edge1 Edge2      Edge0 Edge1 Edge2
   |    |    |            |    |    |
Host0-3 Host4-7 Host8-11
```

#### Troubleshooting

**Error: "Class 'inet::Ipv4NetworkConfigurator' not found"**
- Solution: Make sure you're loading the INET library with `-l ../../../inet/src/libINET.dylib`

**Error: "Cannot resolve module type 'IntegratedCanvasVisualizer'"**
- Solution: The visualizer has been removed for Cmdenv. Make sure you're using the latest CloudTopology.ned

**Error: "find/getModuleByPath(): Syntax error in path 'host[9.8095]'"**
- Solution: Make sure omnetpp.ini uses `intuniform()` instead of `uniform()` for host indices

**Simulation runs but no output**
- Solution: Remove `-cmdenv-express-mode = true` from omnetpp.ini or add `--cmdenv-express-mode=false` to command line

**Permission denied on libINET.dylib**
- Solution: Check that INET was built successfully: `ls -lh ../../../inet/src/libINET.dylib`

### Starting OMNeT++ Simulations (Generic)

#### Command-Line Mode (Cmdenv)

```bash
# Navigate to simulation directory
cd sdn_dashboard/simulations

# Source environment
source ../../setenv

# Run simulation in command-line mode
opp_run -u Cmdenv -f omnetpp.ini -c ConfigName
```

#### Graphical Mode (Qtenv)

```bash
# Source environment
source ../../setenv

# Run simulation with GUI
opp_run -u Qtenv -f omnetpp.ini
```

**Note**: Qtenv provides a graphical interface to visualize and control the simulation.

### Running the Dashboard Backend

```bash
# Navigate to backend directory
cd sdn_dashboard/dashboard/backend

# Start the server
node server.js

# Or with npm script (if configured in package.json):
npm start
```

The backend server will start on `http://localhost:3001` (or configured port).

**Backend features**:
- REST API endpoints for slice and flow management
- WebSocket server for real-time updates
- Communication bridge to OMNeT++ simulation

### Running the Dashboard Frontend

```bash
# Navigate to frontend directory
cd sdn_dashboard/dashboard/frontend

# Start development server
npm start
```

The frontend will open in your browser at `http://localhost:3000`.

**Frontend features**:
- Network topology visualization
- Slice management interface
- Flow table editor
- Real-time statistics dashboard

### Running All Components Together

Open three terminal windows:

**Terminal 1 - OMNeT++ Simulation**:
```bash
cd sdn_dashboard/simulations
source ../../setenv
opp_run -u Cmdenv -f omnetpp.ini
```

**Terminal 2 - Backend Server**:
```bash
cd sdn_dashboard/dashboard/backend
node server.js
```

**Terminal 3 - Frontend**:
```bash
cd sdn_dashboard/dashboard/frontend
npm start
```

---

## Development Workflow

### Building New Simulations

1. **Create NED files** in `sdn_dashboard/simulations/networks/`:

```ned
// Example: SimpleTopology.ned
network SimpleSDNNetwork
{
    submodules:
        controller: OpenFlowController;
        switch1: OpenFlowSwitch;
        switch2: OpenFlowSwitch;
        host1: StandardHost;
        host2: StandardHost;

    connections:
        controller.ethg++ <--> Eth1G <--> switch1.ethg++;
        controller.ethg++ <--> Eth1G <--> switch2.ethg++;
        switch1.ethg++ <--> Eth1G <--> host1.ethg++;
        switch2.ethg++ <--> Eth1G <--> host2.ethg++;
}
```

2. **Generate makefiles** using opp_makemake:

```bash
cd sdn_dashboard/src
source ../../setenv

# Generate makefile
opp_makemake -f --deep -I../../include -L../../lib -loppenvir
```

3. **Build the simulation**:

```bash
make MODE=release
```

### Creating New C++ Modules

1. **Create header file** (e.g., `MyController.h`):

```cpp
#ifndef __MYCONTROLLER_H
#define __MYCONTROLLER_H

#include <omnetpp.h>

using namespace omnetpp;

class MyController : public cSimpleModule
{
  protected:
    virtual void initialize() override;
    virtual void handleMessage(cMessage *msg) override;
};

#endif
```

2. **Create implementation** (e.g., `MyController.cc`):

```cpp
#include "MyController.h"

Define_Module(MyController);

void MyController::initialize()
{
    // Initialization code
}

void MyController::handleMessage(cMessage *msg)
{
    // Message handling code
}
```

3. **Define in NED** (e.g., `MyController.ned`):

```ned
simple MyController
{
    gates:
        inout ethg[];
}
```

### Running Tests

```bash
# Navigate to test directory
cd test/core

# Source environment
source ../../setenv

# Run tests
./runtest
```

### Debugging

#### Using GDB with OMNeT++

```bash
# Build in debug mode
make MODE=debug

# Run with debugger
gdb opp_run
(gdb) run -u Cmdenv -f omnetpp.ini
```

#### OMNeT++ Built-in Debugging

Add to `omnetpp.ini`:

```ini
[General]
debug-on-errors = true
record-eventlog = true
```

This will:
- Break on errors
- Record detailed event log
- Enable verbose output

---

## Common Commands Reference

### OMNeT++ Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `opp_run` | Run simulation | `opp_run -u Qtenv -f omnetpp.ini` |
| `opp_makemake` | Generate makefile | `opp_makemake -f --deep` |
| `opp_msgc` | Compile message files | `opp_msgc Message.msg` |
| `nedtool` | NED file tool | `nedtool -h` |
| `opp_scavetool` | Process result files | `opp_scavetool scalar -F CSV results.sca` |
| `opp_eventlogtool` | Process event logs | `opp_eventlogtool filter results.elog` |

### Build Commands

| Command | Purpose |
|---------|---------|
| `make` | Build in debug mode |
| `make MODE=release` | Build in release mode |
| `make MODE=release -j4` | Parallel build (4 jobs) |
| `make clean` | Clean build artifacts |
| `make cleanall` | Deep clean |
| `make makefiles` | Regenerate makefiles |

### npm Commands (Dashboard)

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm audit fix` | Fix security issues |

### Simulation Commands

```bash
# Run specific configuration
opp_run -u Cmdenv -c ConfigName -f omnetpp.ini

# Run with parameters
opp_run -u Cmdenv -c General --sim-time-limit=100s

# Run batch simulations
opp_runall -j4 omnetpp.ini

# Export results to CSV
opp_scavetool scalar -F CSV -o output.csv results.sca
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "hypot" Compilation Error

**Error**:
```
exprnodes.cc:104:33: error: call to 'createMathFunction' is ambiguous
```

**Solution**: Edit `src/common/exprnodes.cc` line 104:

```cpp
// Change FROM:
if (name == "hypot") return createMathFunction("hypot", hypot);

// TO:
if (name == "hypot") return createMathFunction("hypot", static_cast<double(*)(double,double)>(hypot));
```

Then rebuild:
```bash
make clean
make MODE=release -j4
```

#### 2. "install_name_tool" Warnings (macOS)

**Warning**:
```
install_name_tool: changing install names or rpaths can't be redone
```

**Solution**: This is a harmless warning. The library builds successfully despite this message. You can safely ignore it.

#### 3. Environment Not Set

**Error**:
```
Before running 'configure', please use 'source setenv' to set up your environment.
```

**Solution**:
```bash
cd /path/to/Cloud-Based-SDN-Management-Dashboard-Simulation
source setenv
./configure
```

#### 4. Python Module Warnings

**Warning**:
```
Some Python modules required by the IDE were not found: numpy 2.1.3 was found,
but numpy<2.0.0,>=1.18.0 is required.
```

**Solution**: These warnings are safe to ignore if you disabled Python support in `configure.user`. If you need Python support:

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
python3 -m pip install -r python/requirements.txt
```

#### 5. Qt5 Not Found

**Error**:
```
checking for Qt5... no
```

**Solution** (macOS):
```bash
brew install qt@5
brew link qt@5
```

**Solution** (Linux):
```bash
sudo apt install qt5-default qttools5-dev-tools
```

#### 6. "configure.user" Not Found

**Error**:
```
Error: '$dir' does not look like an OMNeT++ root directory
```

**Solution**:
```bash
cp configure.user.dist configure.user
```

#### 7. Library Linking Errors

**Error**:
```
ld: library not found for -loppenvir
```

**Solution**:
```bash
# Make sure environment is sourced
source setenv

# Rebuild OMNeT++
make clean
make MODE=release -j4

# Verify libraries exist
ls -la lib/
```

#### 8. Apple Silicon vs Intel Issues (macOS)

**Error**:
```
We are running on Apple Silicon, but you have downloaded the x86_64 version!
```

**Solution**: The setenv script handles this automatically. If issues persist:

```bash
# For Apple Silicon
arch -arm64 zsh
source setenv

# For Intel
arch -x86_64 zsh
source setenv
```

#### 9. Node.js Version Too Old

**Error**:
```
npm requires Node.js version 22.0 or higher
```

**Solution**:
```bash
# macOS
brew upgrade node

# Linux (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

#### 10. Port Already in Use

**Error**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm start
```

### Getting Help

If you encounter issues not covered here:

1. **Check OMNeT++ documentation**: `doc/manual/index.html`
2. **Check INET documentation**: In the `inet/doc/` directory
3. **Review build logs**: Look for specific error messages
4. **Check environment**: Run `echo $OMNETPP_ROOT` and `which opp_run`

---

## Verification Checklist

Use this checklist to verify your installation:

### OMNeT++ Verification

- [ ] `source setenv` completes without errors
- [ ] `which opp_run` returns path to OMNeT++ bin directory
- [ ] `opp_run -h` displays help message
- [ ] `ls bin/` shows compiled executables
- [ ] `ls lib/` shows liboppenvir, liboppsim, etc.

Test command:
```bash
source setenv
opp_run -h
echo $OMNETPP_ROOT
```

Expected output: Version info and OMNeT++ path displayed

### INET Framework Verification

- [ ] INET directory exists at `../inet/`
- [ ] `libINET.dylib` or `libINET.so` exists in `out/clang-release/src/` or `out/gcc-release/src/`
- [ ] Library size is approximately 40-50 MB

Test command:
```bash
ls -lh ../inet/out/*/src/libINET.*
```

Expected output: File size around 40-50M

### Project Structure Verification

- [ ] `sdn_dashboard/` directory exists
- [ ] Backend `node_modules/` directory exists and has packages
- [ ] Frontend `node_modules/` directory exists and has packages
- [ ] Backend `package.json` lists express, ws, cors, body-parser
- [ ] Frontend `package.json` lists react, axios, d3

Test command:
```bash
ls -la sdn_dashboard/
npm list --depth=0
```

### Environment Variables Verification

- [ ] `$OMNETPP_ROOT` is set
- [ ] `$OMNETPP_RELEASE` shows version
- [ ] `$PATH` includes OMNeT++ bin directory

Test command:
```bash
echo $OMNETPP_ROOT
echo $OMNETPP_RELEASE
echo $PATH | grep omnetpp
```

### Sample Simulation Test

Run a sample simulation to verify everything works:

```bash
cd samples/aloha
source ../../setenv
./aloha -u Cmdenv
```

Expected output: Simulation runs and completes successfully

---

## Next Steps

Now that your environment is set up, proceed with implementation:

1. **Review `implementation.md`** for detailed phase-by-phase implementation guide
2. **Create network topologies** using NED files
3. **Implement SDN controller** logic in C++
4. **Build dashboard backend** API and WebSocket server
5. **Develop frontend** React components and visualizations
6. **Test and integrate** all components together

Good luck with your SDN simulation project! 🚀
