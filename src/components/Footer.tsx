import { Github, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="mt-16 py-8 border-t border-border/50">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center space-x-6">
                    <a
                        href="https://github.com/starrftw/awaken-connect"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                        aria-label="GitHub"
                    >
                        <Github className="h-6 w-6" />
                    </a>
                    <a
                        href="https://x.com/starrftw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                        aria-label="X (Twitter)"
                    >
                        <Twitter className="h-6 w-6" />
                    </a>
                </div>
                <p className="text-sm text-muted-foreground">
                    Awaken Connect - Export transactions for tax compliance
                </p>
            </div>
        </footer>
    );
}
