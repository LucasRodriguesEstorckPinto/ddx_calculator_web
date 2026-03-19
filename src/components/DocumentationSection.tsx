import { motion } from "framer-motion";
import { BookOpen, FileCode, Video, MessageCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const resources = [
  {
    icon: BookOpen,
    title: "Manual Completo",
    description: "Guia detalhado com exemplos práticos para cada funcionalidade.",
    color: "text-primary",
    bg: "bg-primary/20",
  },
  {
    icon: FileCode,
    title: "API Reference",
    description: "Documentação técnica para integração e extensão.",
    color: "text-secondary",
    bg: "bg-secondary/20",
  },
  {
    icon: Video,
    title: "Tutoriais em Vídeo",
    description: "Aprenda visualmente com demonstrações passo-a-passo.",
    color: "text-primary",
    bg: "bg-primary/20",
  },
  {
    icon: MessageCircle,
    title: "Comunidade",
    description: "Tire dúvidas e compartilhe conhecimento com outros usuários.",
    color: "text-secondary",
    bg: "bg-secondary/20",
  },
];

const DocumentationSection = () => {
  return (
    <section id="documentation" className="py-16 md:py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <motion.span 
              className="text-secondary text-xs md:text-sm font-medium tracking-wider uppercase mb-3 md:mb-4 block"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              Aprenda
            </motion.span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-foreground">
              Documentação & <span className="text-secondary">Recursos</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-4">
              Tudo que você precisa para dominar o DDX e resolver problemas complexos.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="glass-card rounded-lg md:rounded-xl p-4 md:p-5 text-center group cursor-pointer relative overflow-hidden"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full ${resource.bg} mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <resource.icon className={`w-4 h-4 md:w-5 md:h-5 ${resource.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1 md:mb-2 text-xs md:text-sm">{resource.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed hidden sm:block">{resource.description}</p>
                
                {/* Hover indicator */}
                <motion.div 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowUpRight className={`w-4 h-4 ${resource.color}`} />
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="border-secondary/50 text-secondary hover:bg-secondary/10 hover:border-secondary text-sm md:text-base px-6 md:px-8"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Acessar Documentação
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DocumentationSection;
