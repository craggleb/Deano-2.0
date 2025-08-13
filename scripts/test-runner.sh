#!/bin/bash

# Comprehensive Test Runner for Deano Task Manager
# This script runs all tests and generates coverage reports

set -e

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

# Function to print coloured output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run tests for a package using Docker
run_package_tests() {
    local package=$1
    local test_type=$2
    
    print_status "Running $test_type tests for $package using Docker..."
    
    if [ "$test_type" = "coverage" ]; then
        docker-compose -f docker-compose.test.yml run --rm "${package}-test" npm run test:coverage
    else
        docker-compose -f docker-compose.test.yml run --rm "${package}-test" npm run test
    fi
    
    if [ $? -eq 0 ]; then
        print_success "$package $test_type tests passed"
    else
        print_error "$package $test_type tests failed"
        exit 1
    fi
}

# Function to run linting for a package using Docker
run_package_lint() {
    local package=$1
    
    print_status "Running linting for $package using Docker..."
    
    docker-compose -f docker-compose.test.yml run --rm "${package}-test" npm run lint
    
    if [ $? -eq 0 ]; then
        print_success "$package linting passed"
    else
        print_error "$package linting failed"
        exit 1
    fi
}

# Function to run type checking for a package using Docker
run_package_type_check() {
    local package=$1
    
    print_status "Running type checking for $package using Docker..."
    
    docker-compose -f docker-compose.test.yml run --rm "${package}-test" npm run type-check
    
    if [ $? -eq 0 ]; then
        print_success "$package type checking passed"
    else
        print_error "$package type checking failed"
        exit 1
    fi
}

# Main script
main() {
    print_status "Starting comprehensive test run for Deano Task Manager"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command_exists docker; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command_exists docker-compose; then
        print_error "docker-compose is not installed"
        exit 1
    fi
    
    print_status "Docker found - will use for running all tests in containers"
    
    # Parse command line arguments
    TEST_TYPE="normal"
    RUN_LINT=true
    RUN_TYPE_CHECK=true
    PACKAGES=("api" "web")
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --coverage)
                TEST_TYPE="coverage"
                shift
                ;;
            --no-lint)
                RUN_LINT=false
                shift
                ;;
            --no-type-check)
                RUN_TYPE_CHECK=false
                shift
                ;;
            --api-only)
                PACKAGES=("api")
                shift
                ;;
            --web-only)
                PACKAGES=("web")
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --coverage        Run tests with coverage reports"
                echo "  --no-lint         Skip linting"
                echo "  --no-type-check   Skip type checking"
                echo "  --api-only        Only test the API package"
                echo "  --web-only        Only test the web package"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Start test database
    if [ -f "docker-compose.test.yml" ]; then
        print_status "Starting test database..."
        docker-compose -f docker-compose.test.yml up -d postgres-test
        
        # Wait for database to be ready
        print_status "Waiting for test database to be ready..."
        sleep 10
        
        # Run database migrations
        print_status "Running database migrations..."
        docker-compose -f docker-compose.test.yml run --rm api-test npx prisma migrate deploy
    fi
    
    # Run type checking
    if [ "$RUN_TYPE_CHECK" = true ]; then
        print_status "Running type checking..."
        for package in "${PACKAGES[@]}"; do
            run_package_type_check "$package"
        done
    fi
    
    # Run linting
    if [ "$RUN_LINT" = true ]; then
        print_status "Running linting..."
        for package in "${PACKAGES[@]}"; do
            run_package_lint "$package"
        done
    fi
    
    # Run tests
    print_status "Running $TEST_TYPE tests..."
    for package in "${PACKAGES[@]}"; do
        run_package_tests "$package" "$TEST_TYPE"
    done
    
    # Generate summary
    print_success "All tests completed successfully!"
    
    if [ "$TEST_TYPE" = "coverage" ]; then
        print_status "Coverage reports generated:"
        for package in "${PACKAGES[@]}"; do
            if [ -d "packages/$package/coverage" ]; then
                echo "  - packages/$package/coverage/index.html"
            fi
        done
    fi
    
    # Stop test services
    if [ -f "docker-compose.test.yml" ]; then
        print_status "Stopping test services..."
        docker-compose -f docker-compose.test.yml down
    fi
}

# Run main function with all arguments
main "$@"
