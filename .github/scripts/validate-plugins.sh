#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
total_errors=0
total_warnings=0

# Check for jq, install if not available (for CI environments)
if ! command -v jq &> /dev/null; then
    if [ -f /etc/debian_version ] || [ -f /etc/redhat-release ]; then
        echo "Installing jq..."
        sudo apt-get update -qq && sudo apt-get install -y -qq jq || sudo yum install -y jq
    elif command -v python3 &> /dev/null; then
        # Use python as fallback for JSON validation
        USE_PYTHON_JSON=true
    else
        echo "Error: jq is not installed and python3 is not available"
        exit 1
    fi
else
    USE_PYTHON_JSON=false
fi

# Function to print colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Helper functions for JSON validation
validate_json_syntax() {
    local json_file=$1
    if [ "$USE_PYTHON_JSON" = true ]; then
        python3 -c "import json; json.load(open('$json_file'))" 2>/dev/null
    else
        jq empty "$json_file" 2>/dev/null
    fi
}

get_json_field() {
    local json_file=$1
    local field=$2
    if [ "$USE_PYTHON_JSON" = true ]; then
        python3 -c "import json; data=json.load(open('$json_file')); print(data.get('$field', ''))" 2>/dev/null
    else
        jq -r ".$field // empty" "$json_file" 2>/dev/null
    fi
}

check_json_field_exists() {
    local json_file=$1
    local field=$2
    if [ "$USE_PYTHON_JSON" = true ]; then
        python3 -c "import json; data=json.load(open('$json_file')); exit(0 if '$field' in data else 1)" 2>/dev/null
    else
        jq -e ".$field" "$json_file" > /dev/null 2>&1
    fi
}

# Function to validate plugin.json structure
validate_plugin_json() {
    local plugin_json=$1
    local errors=0

    # Validate JSON syntax
    if ! validate_json_syntax "$plugin_json"; then
        print_error "Invalid JSON syntax in plugin.json"
        return 1
    fi

    # Required fields
    local required_fields=("name" "version" "description")
    for field in "${required_fields[@]}"; do
        if ! check_json_field_exists "$plugin_json" "$field"; then
            print_error "Missing required field: '$field'"
            errors=$((errors + 1))
        else
            local value=$(get_json_field "$plugin_json" "$field")
            if [ -z "$value" ] || [ "$value" = "null" ]; then
                print_error "Field '$field' is empty or null"
                errors=$((errors + 1))
            else
                print_success "Field '$field' present"
            fi
        fi
    done

    # Validate version format (semver)
    local version=$(get_json_field "$plugin_json" "version")
    if [ -n "$version" ] && ! echo "$version" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$'; then
        print_warning "Version '$version' doesn't follow semantic versioning (e.g., 1.0.0)"
        total_warnings=$((total_warnings + 1))
    fi

    # Recommended fields
    if ! check_json_field_exists "$plugin_json" "author"; then
        print_warning "Recommended field 'author' is missing"
        total_warnings=$((total_warnings + 1))
    else
        print_success "Field 'author' present"
    fi

    if ! check_json_field_exists "$plugin_json" "license"; then
        print_warning "Recommended field 'license' is missing"
        total_warnings=$((total_warnings + 1))
    else
        print_success "Field 'license' present"
    fi

    # Validate plugin name format (lowercase, alphanumeric, hyphens)
    local name=$(get_json_field "$plugin_json" "name")
    if [ -n "$name" ] && ! echo "$name" | grep -qE '^[a-z0-9-]+$'; then
        print_error "Plugin name '$name' must be lowercase alphanumeric with hyphens only"
        errors=$((errors + 1))
    fi

    return $errors
}

# Function to validate command files
validate_commands() {
    local commands_dir=$1
    local errors=0

    if [ ! -d "$commands_dir" ]; then
        return 0  # Commands are optional
    fi

    local cmd_files=$(find "$commands_dir" -name "*.md" -type f)
    if [ -z "$cmd_files" ]; then
        print_warning "commands/ directory exists but contains no .md files"
        total_warnings=$((total_warnings + 1))
        return 0
    fi

    local cmd_count=0
    for cmd_file in $cmd_files; do
        cmd_count=$((cmd_count + 1))
        local cmd_name=$(basename "$cmd_file" .md)

        # Check if file has content
        if [ ! -s "$cmd_file" ]; then
            print_warning "Command file '$cmd_name.md' is empty"
            total_warnings=$((total_warnings + 1))
        fi

        # Validate command name format (lowercase, alphanumeric, hyphens)
        if ! echo "$cmd_name" | grep -qE '^[a-z0-9-]+$'; then
            print_error "Command file '$cmd_name.md' has invalid name (use lowercase, alphanumeric, hyphens)"
            errors=$((errors + 1))
        fi
    done

    print_success "Found $cmd_count command file(s)"
    return $errors
}

# Function to validate skill files
validate_skills() {
    local skills_dir=$1
    local errors=0

    if [ ! -d "$skills_dir" ]; then
        return 0  # Skills are optional
    fi

    local skill_files=$(find "$skills_dir" -name "*.md" -type f)
    if [ -z "$skill_files" ]; then
        print_warning "skills/ directory exists but contains no .md files"
        total_warnings=$((total_warnings + 1))
        return 0
    fi

    local skill_count=0
    for skill_file in $skill_files; do
        skill_count=$((skill_count + 1))
        local skill_name=$(basename "$skill_file" .md)

        # Check if file has content
        if [ ! -s "$skill_file" ]; then
            print_warning "Skill file '$skill_name.md' is empty"
            total_warnings=$((total_warnings + 1))
        fi

        # Validate skill name format (lowercase, alphanumeric, hyphens)
        if ! echo "$skill_name" | grep -qE '^[a-z0-9-]+$'; then
            print_error "Skill file '$skill_name.md' has invalid name (use lowercase, alphanumeric, hyphens)"
            errors=$((errors + 1))
        fi
    done

    print_success "Found $skill_count skill file(s)"
    return $errors
}

# Function to validate a single plugin
validate_plugin() {
    local plugin_dir=$1
    local plugin_name=$(basename "$plugin_dir")
    local errors=0

    print_header "Validating plugin: $plugin_name"

    # Validate plugin name format
    if ! echo "$plugin_name" | grep -qE '^[a-z0-9-]+$'; then
        print_error "Plugin directory name '$plugin_name' must be lowercase alphanumeric with hyphens"
        errors=$((errors + 1))
    fi

    # Check for .claude-plugin directory
    if [ ! -d "$plugin_dir/.claude-plugin" ]; then
        print_error "Missing .claude-plugin/ directory"
        errors=$((errors + 1))
        return $errors
    fi
    print_success ".claude-plugin/ directory exists"

    # Check for plugin.json
    if [ ! -f "$plugin_dir/.claude-plugin/plugin.json" ]; then
        print_error "Missing .claude-plugin/plugin.json"
        errors=$((errors + 1))
        return $errors
    fi
    print_success "plugin.json exists"

    # Validate plugin.json
    if ! validate_plugin_json "$plugin_dir/.claude-plugin/plugin.json"; then
        errors=$((errors + 1))
    fi

    # Verify plugin.json name matches directory name
    local json_name=$(get_json_field "$plugin_dir/.claude-plugin/plugin.json" "name")
    if [ -n "$json_name" ] && [ "$json_name" != "$plugin_name" ]; then
        print_error "Plugin name in plugin.json ('$json_name') doesn't match directory name ('$plugin_name')"
        errors=$((errors + 1))
    fi

    # Check for README.md
    if [ ! -f "$plugin_dir/README.md" ]; then
        print_error "Missing README.md"
        errors=$((errors + 1))
    elif [ ! -s "$plugin_dir/README.md" ]; then
        print_warning "README.md is empty"
        total_warnings=$((total_warnings + 1))
    else
        print_success "README.md exists and has content"
    fi

    # Check for LICENSE
    if [ ! -f "$plugin_dir/LICENSE" ] && [ ! -f "$plugin_dir/LICENSE.md" ] && [ ! -f "$plugin_dir/LICENSE.txt" ]; then
        print_warning "No LICENSE file found (recommended)"
        total_warnings=$((total_warnings + 1))
    else
        print_success "LICENSE file exists"
    fi

    # Validate commands if present
    if ! validate_commands "$plugin_dir/commands"; then
        errors=$((errors + 1))
    fi

    # Validate skills if present
    if ! validate_skills "$plugin_dir/skills"; then
        errors=$((errors + 1))
    fi

    # Check that plugin has at least commands or skills
    if [ ! -d "$plugin_dir/commands" ] && [ ! -d "$plugin_dir/skills" ]; then
        print_warning "Plugin has neither commands/ nor skills/ directory"
        total_warnings=$((total_warnings + 1))
    fi

    # Check for unexpected files/directories in .claude-plugin
    local unexpected_files=$(find "$plugin_dir/.claude-plugin" -mindepth 1 ! -name "plugin.json" -type f)
    if [ -n "$unexpected_files" ]; then
        print_warning "Unexpected files in .claude-plugin/ directory:"
        echo "$unexpected_files" | while read -r file; do
            echo "   - $(basename "$file")"
        done
        total_warnings=$((total_warnings + 1))
    fi

    echo ""
    if [ $errors -gt 0 ]; then
        print_error "Validation failed with $errors error(s)"
        total_errors=$((total_errors + errors))
        return 1
    else
        print_success "Plugin validation passed!"
        return 0
    fi
}

# Main execution
main() {
    local target_dir="${1:-submissions}"

    print_header "Claude Code Marketplace Plugin Validator"
    print_info "Validating plugins in: $target_dir"

    # Check if target directory exists
    if [ ! -d "$target_dir" ]; then
        print_error "Directory '$target_dir' not found"
        exit 1
    fi

    # Find all plugin directories
    local plugin_dirs=$(find "$target_dir" -mindepth 1 -maxdepth 1 -type d | sort)

    if [ -z "$plugin_dirs" ]; then
        print_warning "No plugin directories found in $target_dir/"
        exit 0
    fi

    # Count plugins
    local plugin_count=$(echo "$plugin_dirs" | wc -l | tr -d ' ')
    print_info "Found $plugin_count plugin(s) to validate"

    # Validate each plugin
    local failed_plugins=0
    for plugin_dir in $plugin_dirs; do
        if ! validate_plugin "$plugin_dir"; then
            failed_plugins=$((failed_plugins + 1))
        fi
    done

    # Print summary
    print_header "Validation Summary"
    echo "Total plugins: $plugin_count"
    echo "Failed: $failed_plugins"
    echo "Passed: $((plugin_count - failed_plugins))"
    echo "Total errors: $total_errors"
    echo "Total warnings: $total_warnings"
    echo ""

    if [ $total_errors -gt 0 ]; then
        print_error "Validation failed with $total_errors error(s)"
        echo ""
        echo "Please fix the errors above and resubmit."
        echo "See CONTRIBUTING.md for detailed guidelines."
        exit 1
    else
        print_success "All plugins validated successfully! 🎉"
        if [ $total_warnings -gt 0 ]; then
            echo ""
            print_warning "Note: There are $total_warnings warning(s) that should be addressed"
        fi
        exit 0
    fi
}

# Run main function
main "$@"
