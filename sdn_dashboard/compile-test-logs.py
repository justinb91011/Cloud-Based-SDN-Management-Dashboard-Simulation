#!/usr/bin/env python3
"""
Test Log Compilation Tool for Phase 8
Analyzes and compiles test results from multiple log files
"""

import os
import re
import json
import glob
from datetime import datetime
from collections import defaultdict

class TestLogCompiler:
    def __init__(self, log_dir='.'):
        self.log_dir = log_dir
        self.results = {
            'summary': {},
            'performance_metrics': {},
            'test_results': [],
            'errors': [],
            'warnings': []
        }

    def find_log_files(self):
        """Find all test result log files"""
        patterns = [
            'test-results-*.log',
            'test-phase*.log',
            'performance-*.log'
        ]

        log_files = []
        for pattern in patterns:
            log_files.extend(glob.glob(os.path.join(self.log_dir, pattern)))

        return sorted(log_files)

    def parse_metrics(self, content):
        """Extract performance metrics from log content"""
        metrics = {
            'response_times': [],
            'operation_times': [],
            'success_rates': []
        }

        # Extract response times
        time_pattern = r'Duration: (\d+)ms'
        times = re.findall(time_pattern, content)
        metrics['response_times'] = [int(t) for t in times]

        # Extract average times
        avg_pattern = r'Average time[^:]*: (\d+)ms'
        avg_times = re.findall(avg_pattern, content)
        metrics['operation_times'] = [int(t) for t in avg_times]

        # Extract success rates
        success_pattern = r'successRate[^:]*:\s*"([^"]*)"'
        rates = re.findall(success_pattern, content)
        for rate in rates:
            try:
                metrics['success_rates'].append(float(rate.rstrip('%')))
            except ValueError:
                pass

        return metrics

    def parse_test_sections(self, content):
        """Parse individual test sections"""
        sections = []
        section_pattern = r'={3,}\s*\n(Test \d+:.*?)\n={3,}\s*\n(.*?)(?=\n={3,}|$)'

        matches = re.finditer(section_pattern, content, re.DOTALL)
        for match in matches:
            title = match.group(1).strip()
            body = match.group(2).strip()

            section = {
                'title': title,
                'content': body,
                'metrics': self.parse_metrics(body)
            }

            # Check for errors
            if 'error' in body.lower() or 'failed' in body.lower():
                section['status'] = 'FAILED'
            else:
                section['status'] = 'PASSED'

            sections.append(section)

        return sections

    def parse_log_file(self, filepath):
        """Parse a single log file"""
        print(f"Parsing: {filepath}")

        try:
            with open(filepath, 'r') as f:
                content = f.read()

            # Extract timestamp
            timestamp_match = re.search(r'Test Started: (.+)', content)
            timestamp = timestamp_match.group(1) if timestamp_match else 'Unknown'

            # Parse test sections
            sections = self.parse_test_sections(content)

            # Extract overall metrics
            metrics = self.parse_metrics(content)

            result = {
                'filename': os.path.basename(filepath),
                'timestamp': timestamp,
                'sections': sections,
                'metrics': metrics
            }

            return result

        except Exception as e:
            print(f"Error parsing {filepath}: {e}")
            return None

    def compile_results(self):
        """Compile all test results"""
        log_files = self.find_log_files()

        if not log_files:
            print("No log files found!")
            return

        print(f"\nFound {len(log_files)} log file(s)")
        print("=" * 70)

        for log_file in log_files:
            result = self.parse_log_file(log_file)
            if result:
                self.results['test_results'].append(result)

        # Calculate summary statistics
        self.calculate_summary()

    def calculate_summary(self):
        """Calculate summary statistics across all tests"""
        all_response_times = []
        all_operation_times = []
        all_success_rates = []
        total_tests = 0
        passed_tests = 0

        for test_result in self.results['test_results']:
            for section in test_result['sections']:
                total_tests += 1
                if section['status'] == 'PASSED':
                    passed_tests += 1

                # Aggregate metrics
                all_response_times.extend(section['metrics']['response_times'])
                all_operation_times.extend(section['metrics']['operation_times'])
                all_success_rates.extend(section['metrics']['success_rates'])

        # Calculate statistics
        self.results['summary'] = {
            'total_log_files': len(self.results['test_results']),
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': total_tests - passed_tests,
            'pass_rate': f"{(passed_tests / total_tests * 100):.1f}%" if total_tests > 0 else "N/A"
        }

        if all_response_times:
            self.results['performance_metrics']['response_time'] = {
                'min': min(all_response_times),
                'max': max(all_response_times),
                'avg': sum(all_response_times) / len(all_response_times),
                'count': len(all_response_times)
            }

        if all_operation_times:
            self.results['performance_metrics']['operation_time'] = {
                'min': min(all_operation_times),
                'max': max(all_operation_times),
                'avg': sum(all_operation_times) / len(all_operation_times),
                'count': len(all_operation_times)
            }

        if all_success_rates:
            self.results['performance_metrics']['success_rate'] = {
                'min': min(all_success_rates),
                'max': max(all_success_rates),
                'avg': sum(all_success_rates) / len(all_success_rates),
                'count': len(all_success_rates)
            }

    def print_report(self):
        """Print compilation report"""
        print("\n" + "=" * 70)
        print("TEST LOG COMPILATION REPORT")
        print("=" * 70)

        # Summary
        print("\nSUMMARY:")
        print("-" * 70)
        for key, value in self.results['summary'].items():
            print(f"  {key.replace('_', ' ').title()}: {value}")

        # Performance Metrics
        if self.results['performance_metrics']:
            print("\nPERFORMANCE METRICS:")
            print("-" * 70)

            if 'response_time' in self.results['performance_metrics']:
                rt = self.results['performance_metrics']['response_time']
                print(f"  Response Times (ms):")
                print(f"    Min: {rt['min']:.2f}")
                print(f"    Max: {rt['max']:.2f}")
                print(f"    Avg: {rt['avg']:.2f}")
                print(f"    Count: {rt['count']}")

            if 'operation_time' in self.results['performance_metrics']:
                ot = self.results['performance_metrics']['operation_time']
                print(f"\n  Operation Times (ms):")
                print(f"    Min: {ot['min']:.2f}")
                print(f"    Max: {ot['max']:.2f}")
                print(f"    Avg: {ot['avg']:.2f}")
                print(f"    Count: {ot['count']}")

            if 'success_rate' in self.results['performance_metrics']:
                sr = self.results['performance_metrics']['success_rate']
                print(f"\n  Success Rates (%):")
                print(f"    Min: {sr['min']:.1f}")
                print(f"    Max: {sr['max']:.1f}")
                print(f"    Avg: {sr['avg']:.1f}")
                print(f"    Count: {sr['count']}")

        # Test Results by File
        print("\nTEST RESULTS BY FILE:")
        print("-" * 70)
        for test_result in self.results['test_results']:
            print(f"\n  File: {test_result['filename']}")
            print(f"  Timestamp: {test_result['timestamp']}")
            print(f"  Sections: {len(test_result['sections'])}")

            for section in test_result['sections']:
                status_symbol = "✓" if section['status'] == 'PASSED' else "✗"
                print(f"    {status_symbol} {section['title']} - {section['status']}")

        print("\n" + "=" * 70)

    def save_json_report(self, output_file='test-compilation-report.json'):
        """Save results as JSON"""
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\nJSON report saved to: {output_file}")

    def save_html_report(self, output_file='test-compilation-report.html'):
        """Save results as HTML"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Test Compilation Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #555;
            border-bottom: 2px solid #ddd;
            padding-bottom: 5px;
            margin-top: 30px;
        }}
        .summary {{
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }}
        .metric {{
            display: inline-block;
            margin: 10px 20px 10px 0;
        }}
        .metric-label {{
            font-weight: bold;
            color: #666;
        }}
        .metric-value {{
            font-size: 1.2em;
            color: #4CAF50;
        }}
        .test-file {{
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .test-section {{
            margin-left: 20px;
            padding: 10px;
            border-left: 3px solid #e0e0e0;
            margin-top: 10px;
        }}
        .passed {{
            color: #4CAF50;
        }}
        .failed {{
            color: #f44336;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            margin-top: 10px;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #4CAF50;
            color: white;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
    </style>
</head>
<body>
    <h1>Test Log Compilation Report</h1>
    <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

    <div class="summary">
        <h2>Summary</h2>
"""

        # Add summary metrics
        for key, value in self.results['summary'].items():
            html += f"""
        <div class="metric">
            <span class="metric-label">{key.replace('_', ' ').title()}:</span>
            <span class="metric-value">{value}</span>
        </div>
"""

        html += """
    </div>
"""

        # Add performance metrics
        if self.results['performance_metrics']:
            html += """
    <div class="summary">
        <h2>Performance Metrics</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Min</th>
                <th>Max</th>
                <th>Average</th>
                <th>Count</th>
            </tr>
"""

            for metric_name, metric_data in self.results['performance_metrics'].items():
                html += f"""
            <tr>
                <td>{metric_name.replace('_', ' ').title()}</td>
                <td>{metric_data['min']:.2f}</td>
                <td>{metric_data['max']:.2f}</td>
                <td>{metric_data['avg']:.2f}</td>
                <td>{metric_data['count']}</td>
            </tr>
"""

            html += """
        </table>
    </div>
"""

        # Add test results
        html += """
    <h2>Test Results by File</h2>
"""

        for test_result in self.results['test_results']:
            html += f"""
    <div class="test-file">
        <h3>{test_result['filename']}</h3>
        <p><strong>Timestamp:</strong> {test_result['timestamp']}</p>
"""

            for section in test_result['sections']:
                status_class = 'passed' if section['status'] == 'PASSED' else 'failed'
                status_symbol = '✓' if section['status'] == 'PASSED' else '✗'

                html += f"""
        <div class="test-section">
            <strong class="{status_class}">{status_symbol} {section['title']}</strong>
            <span class="{status_class}"> - {section['status']}</span>
        </div>
"""

            html += """
    </div>
"""

        html += """
</body>
</html>
"""

        with open(output_file, 'w') as f:
            f.write(html)

        print(f"HTML report saved to: {output_file}")


def main():
    print("SDN Dashboard Test Log Compiler - Phase 8")
    print("=" * 70)

    compiler = TestLogCompiler()
    compiler.compile_results()
    compiler.print_report()
    compiler.save_json_report()
    compiler.save_html_report()

    print("\nCompilation complete!")


if __name__ == '__main__':
    main()
