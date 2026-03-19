import { motion } from "framer-motion";
import { Github, FileText, User, Heart, ExternalLink } from "lucide-react";
import uerjLogo from "@/assets/uerj-iprj-logo.png";

const Footer = () => {
  const links = [
    {
      icon: Github,
      label: "GitHub",
      href: "#",
      description: "Ver código fonte",
    },
    {
      icon: FileText,
      label: "Documentação",
      href: "#",
      description: "Manual completo",
    },
    {
      icon: User,
      label: "Portfólio",
      href: "#",
      description: "Conheça o criador",
    },
  ];

  return (
    <footer className="py-12 md:py-16 border-t border-border/20 relative">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 md:w-96 h-32 md:h-48 bg-primary/10 rounded-full filter blur-[80px] md:blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Top Section with Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 md:mb-12"
          >
            {/* DDX Logo and UERJ */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-1 text-2xl md:text-3xl font-bold">
                <span className="text-foreground">D</span>
                <span className="text-primary">D</span>
                <span className="text-foreground">X</span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-border/50" />
              <img 
                src={uerjLogo} 
                alt="UERJ-IPRJ Instituto Politécnico" 
                className="h-10 md:h-12 w-auto object-contain"
              />
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {links.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm"
                >
                  <link.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3 md:gap-6 mb-10 md:mb-12"
          >
            {links.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                whileHover={{ y: -5 }}
                className="glass-card rounded-lg md:rounded-xl px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 group hover:border-primary/30 transition-colors duration-300"
              >
                <link.icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                <div>
                  <div className="font-medium text-foreground text-xs md:text-sm">{link.label}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{link.description}</div>
                </div>
              </motion.a>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6 md:mb-8" />

          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">D</span>
              <span className="font-bold text-primary">D</span>
              <span className="font-bold text-foreground">X</span>
              <span className="mx-2">•</span>
              <span>Cálculo Multivariável</span>
            </div>
            <div className="flex items-center gap-1">
              © {new Date().getFullYear()} DDX. Feito com{" "}
              <Heart className="w-3 h-3 md:w-4 md:h-4 text-destructive fill-destructive mx-1" />
              para estudantes.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
