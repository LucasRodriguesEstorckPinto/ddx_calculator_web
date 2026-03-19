import { motion } from "framer-motion";
import { Code2, Cpu, BookOpen, GraduationCap } from "lucide-react";
import uerjLogo from "@/assets/uerj-iprj-logo.png";

const AboutSection = () => {
  const techStack = [
    {
      icon: Code2,
      title: "SymPy",
      description: "Motor de cálculo simbólico para derivadas, integrais e limites exatos.",
      color: "text-primary",
      bg: "bg-primary/20",
    },
    {
      icon: Cpu,
      title: "NumPy",
      description: "Computação numérica de alta performance para visualizações e cálculos rápidos.",
      color: "text-secondary",
      bg: "bg-secondary/20",
    },
    {
      icon: BookOpen,
      title: "Algoritmos de Engenharia",
      description: "Métodos numéricos otimizados baseados em literatura acadêmica.",
      color: "text-primary",
      bg: "bg-primary/20",
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-secondary/10 rounded-full filter blur-[100px] md:blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-64 md:w-80 h-64 md:h-80 bg-primary/5 rounded-full filter blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-xs md:text-sm font-medium tracking-wider uppercase mb-3 md:mb-4 block">
              Sobre o DDX
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
              Construído por{" "}
              <span className="gradient-text">Engenheiros</span>,
              <br />
              Para Engenheiros
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 leading-relaxed">
              O DDX nasceu de uma necessidade real durante o curso de Engenharia da Computação. 
              Combinando o poder do cálculo simbólico do <span className="text-primary font-medium">SymPy</span> com 
              a eficiência numérica do <span className="text-secondary font-medium">NumPy</span>, criamos uma ferramenta 
              que simplifica problemas complexos de Cálculo Multivariável.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 md:mb-8">
              Nossa missão é democratizar o aprendizado de matemática avançada, 
              oferecendo soluções passo-a-passo que ajudam estudantes a entender 
              não apenas o "como", mas também o "porquê" por trás de cada operação.
            </p>

            {/* Institution Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-card rounded-xl p-4 md:p-6 inline-flex items-center gap-4"
            >
              <div className="p-2 md:p-3 bg-foreground/10 rounded-lg">
                <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Desenvolvido no</p>
                <img 
                  src={uerjLogo} 
                  alt="UERJ-IPRJ Instituto Politécnico" 
                  className="h-8 md:h-10 w-auto object-contain"
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Tech Stack Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-3 md:space-y-4"
          >
            {techStack.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ x: 10 }}
                className="glass-card rounded-xl p-4 md:p-5 flex items-start gap-3 md:gap-4 group cursor-pointer"
              >
                <div className={`p-2 md:p-3 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">{item.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
