import { motion } from "framer-motion";
import { Sigma, TrendingUp, Layers3, LineChart, Zap, Brain } from "lucide-react";

const features = [
  {
    icon: Sigma,
    title: "Derivação Avançada",
    description: "Suporte para derivadas parciais e implícitas com cálculo simbólico de alta precisão.",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Limites Passo-a-Passo",
    description: "Resolução de indeterminações complexas usando a regra de L'Hôpital com explicações detalhadas.",
    gradient: "from-secondary/20 to-secondary/5",
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary",
  },
  {
    icon: Layers3,
    title: "Integrais Múltiplas",
    description: "Integração simbólica e numérica para cálculo de áreas e volumes em múltiplas dimensões.",
    gradient: "from-primary/20 to-secondary/5",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: LineChart,
    title: "Visualização de Dados",
    description: "Gráficos 3D e 2D interativos com interpolação customizada e animações suaves.",
    gradient: "from-secondary/20 to-primary/5",
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary",
  },
  {
    icon: Zap,
    title: "Performance Otimizada",
    description: "Algoritmos otimizados para cálculos rápidos mesmo com funções complexas.",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    icon: Brain,
    title: "IA Assistente",
    description: "Sugestões inteligentes e correções automáticas para expressões matemáticas.",
    gradient: "from-secondary/20 to-secondary/5",
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 md:py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-0 w-48 md:w-72 h-48 md:h-72 bg-primary/10 rounded-full filter blur-[80px] md:blur-[100px]" />
      <div className="absolute top-1/2 right-0 w-48 md:w-72 h-48 md:h-72 bg-secondary/10 rounded-full filter blur-[80px] md:blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <motion.span 
            className="text-primary text-xs md:text-sm font-medium tracking-wider uppercase mb-3 md:mb-4 block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            Recursos
          </motion.span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            <span className="text-foreground">Funcionalidades</span>{" "}
            <span className="text-primary">Poderosas</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Ferramentas matemáticas avançadas projetadas para estudantes e profissionais de engenharia.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className={`glass-card rounded-xl md:rounded-2xl p-5 md:p-6 h-full relative overflow-hidden bg-gradient-to-br ${feature.gradient}`}>
                {/* Icon */}
                <div className={`mb-3 md:mb-4 inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl ${feature.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-5 h-5 md:w-6 md:h-6 ${feature.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect line */}
                <div className="absolute bottom-0 left-0 h-0.5 md:h-1 bg-gradient-to-r from-primary to-secondary w-0 group-hover:w-full transition-all duration-500" />
                
                {/* Corner decoration */}
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
