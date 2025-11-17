import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Hero from "@/components/sections/Hero";
import ProblemSolution from "@/components/sections/ProblemSolution";
import HowItWorks from "@/components/sections/HowItWorks";
import Benefits from "@/components/sections/Benefits";
import FreeTrial from "@/components/sections/FreeTrial";
import PricingPlans from "@/components/sections/PricingPlans";
import SocialProof from "@/components/sections/SocialProof";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OrganizadoresLanding = () => {
  const navigate = useNavigate();
  const { user } = useCustomAuth();

  const handleCTAClick = async () => {
    if (!user) {
      navigate('/cadastro?tipo=organizador');
      return;
    }

    const { data: orgData } = await supabase
      .from('scribia_organizadores' as any)
      .select('id')
      .eq('user_id', user.profile.id)
      .maybeSingle();

    if (orgData) {
      const { data: eventoData } = await (supabase
        .from('scribia_eventos') as any)
        .select('id')
        .eq('organizador_id', (orgData as any).id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (eventoData) {
        navigate(`/organizador/dashboard/${eventoData.id}`);
      } else {
        navigate('/organizador/criar-evento');
      }
      return;
    }

    navigate('/organizador/cadastro');
  };

  const title = "Scribia — Página para Organizadores";
  const description = "Exemplos de conteúdo para organizadores (ajuste depois).";
  const canonical = "/organizadores";

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pergunta de exemplo para organizadores",
        acceptedAnswer: { "@type": "Answer", text: "Resposta de exemplo." },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <main>
        <div className="container mx-auto px-4 mt-4">
          <Button variant="outline" asChild>
            <a href="/">Voltar para a Home</a>
          </Button>
        </div>

        <section className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
            Transforme seu evento em um motor contínuo de engajamento, comunidade e vendas
          </h1>

          <p className="text-muted-foreground mb-4">
            Você já percebeu que o verdadeiro desafio de um evento não é só realizá-lo com perfeição, mas manter as pessoas aquecidas, engajadas e conectadas depois que ele termina?
          </p>
          <p className="text-muted-foreground mb-4">E você já se perguntou:</p>
          <ul className="list-disc pl-6 space-y-1 mb-6 text-muted-foreground">
            <li>Como manter seu público interessado pela marca do evento durante o ano inteiro?</li>
            <li>Como transformar participantes em uma comunidade ativa e receptiva aos próximos convites?</li>
            <li>Como reduzir o custo de aquisição para as próximas edições?</li>
            <li>Como fazer com que o evento deixe de ser “único” e se torne parte da rotina do público?</li>
            <li>Como vender mentorias, cursos, produtos ou novos eventos sem ter que começar do zero toda vez?</li>
          </ul>

          <p className="text-muted-foreground mb-6">
            E se existisse uma forma de continuar presente — de manter o público engajado, aquecido e esperando ansiosamente pelo próximo movimento?
          </p>

          <h2 className="text-2xl font-bold mb-3">O ScribIA faz exatamente isso</h2>
          <p className="text-muted-foreground mb-6">
            Transforma seu evento em um ecossistema vivo, onde a sua marca continua conversando com o público muito depois do encerramento.
          </p>

          <h2 className="text-2xl font-bold mb-4">🔥 Por que Organizadores Inteligentes Escolhem o ScribIA?</h2>
          <ol className="list-decimal pl-6 space-y-4 mb-8">
            <li>
              <p className="font-semibold">Engajamento contínuo entre uma edição e outra</p>
              <p className="text-muted-foreground">Cada palestra vira um Livebook interativo, que circula, gera conversa e mantém o público em contato com o evento através do Tutor ScribIA. Seu evento deixa de ser pontual, vira recorrente na vida das pessoas.</p>
            </li>
            <li>
              <p className="font-semibold">Aumenta drasticamente a taxa de retorno dos participantes</p>
              <p className="text-muted-foreground">Quando o público recebe valor contínuo, ele volta. Volta para a próxima edição, para comprar o próximo workshop, para participar da próxima formação. O ScribIA cria essa ponte.</p>
            </li>
            <li>
              <p className="font-semibold">Uma nova forma de monetizar o pós-evento</p>
              <p className="text-muted-foreground">Com os Livebooks, você pode vender trilhas de conteúdo, oferecer bônus exclusivos, criar clubes de assinatura do evento, aquecer leads para produtos educacionais e criar séries temáticas para manter o público ativo. É um pós-evento lucrativo, não apenas um “arquivo morto”.</p>
            </li>
            <li>
              <p className="font-semibold">Um presente que fortalece a marca do evento</p>
              <p className="text-muted-foreground">Participantes sentem que receberam algo exclusivo e de altíssimo valor. Palestrantes se emocionam ao ver suas ideias ganhar formato profissional. Patrocinadores ganham presença inteligente no conteúdo. Resultado? Seu evento vira inesquecível.</p>
            </li>
            <li>
              <p className="font-semibold">Suas próximas vendas ficam muito mais fáceis</p>
              <p className="text-muted-foreground">Quando as pessoas leem o Livebook na semana seguinte, comentam, compartilham e revisitam o conteúdo, elas permanecem aquecidas. Isso diminui o custo de aquisição, o esforço de remarketing e o tempo entre edições — e aumenta o interesse, o retorno e o valor da marca do evento.</p>
            </li>
          </ol>

          <h2 className="text-2xl font-bold mb-4">🔵 Como o ScribIA Funciona Para Organizadores</h2>
          <ol className="list-decimal pl-6 space-y-4 mb-8">
            <li>
              <p className="font-semibold">Os participantes recebem acesso total ao ScribIA</p>
              <p className="text-muted-foreground">Ao contratar o ScribIA, todos os participantes ganham acesso à plataforma durante o evento — sem restrições, sem login complicado, sem travas. Eles podem entrar pelo QR Code ou link personalizado do evento.</p>
            </li>
            <li>
              <p className="font-semibold">Cada participante envia os áudios das palestras que quiser</p>
              <p className="text-muted-foreground">Eles mesmos escolhem as palestras que desejam registrar, gravam diretamente no celular e enviam para o ScribIA em segundos. Nada passa pela sua equipe — tudo é self-service e fluido.</p>
              <p className="text-muted-foreground">Observação: Se o organizador preferir (ou dependendo do plano), a equipe do ScribIA pode coletar todos os áudios do evento e gerar automaticamente os Livebooks oficiais de cada palestra.</p>
            </li>
            <li>
              <p className="font-semibold">A IA transforma cada áudio em um Livebook inteligente</p>
              <p className="text-muted-foreground">Para cada palestra enviada, o ScribIA cria um Livebook com insights estruturados, destaques, aplicações práticas, citações, slides comentados (caso fornecidos) e visual elegante e padronizado. É conteúdo profissional criado em segundos.</p>
            </li>
            <li>
              <p className="font-semibold">Seu público lê, compartilha e gera engajamento contínuo</p>
              <p className="text-muted-foreground">Os participantes acessam seus Livebooks a qualquer momento. Eles compartilham trechos, revisam o conteúdo, conversam sobre os insights e mantêm o evento vivo muito além da programação.</p>
            </li>
            <li>
              <p className="font-semibold">Você recebe métricas reais de engajamento</p>
              <p className="text-muted-foreground">No painel do organizador, você acompanha número de Livebooks criados, temas mais acessados, palestras mais gravadas, engajamento por trilha, alcance social, presença do patrocinador nos conteúdos e evolução do interesse entre palestras. Dados para melhorar as próximas edições, criar novos produtos, vender ingressos com mais facilidade e justificar investimentos para patrocinadores.</p>
            </li>
          </ol>

          <h2 className="text-2xl font-bold mb-4">💎 Benefícios do ScribIA para Organizadores</h2>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li><span className="font-semibold">Engajamento contínuo:</span> Seu público permanece ativo e conectado ao evento mesmo depois do encerramento.</li>
            <li><span className="font-semibold">Público aquecido para próximas edições:</span> Os Livebooks mantêm a atenção do participante, facilitando a venda da próxima edição.</li>
            <li><span className="font-semibold">Inteligência para novos produtos:</span> As métricas mostram quais temas geraram mais interesse — perfeito para criar trilhas, workshops e eventos satélites.</li>
            <li><span className="font-semibold">Livebooks feitos pelos próprios participantes:</span> Eles enviam os áudios das palestras que quiserem e recebem o conteúdo organizado automaticamente.</li>
            <li><span className="font-semibold">Coleta completa opcional:</span> Dependendo do plano, a equipe ScribIA pode capturar todos os áudios e gerar Livebooks oficiais.</li>
            <li><span className="font-semibold">Patrocinadores mais satisfeitos:</span> A marca deles aparece no conteúdo que realmente circula e engaja.</li>
            <li><span className="font-semibold">Experiência moderna e memorável:</span> Seu evento ganha uma camada extra de valor, percebida imediatamente pelos participantes e palestrantes.</li>
          </ul>

          <p className="mb-6">Você quer organizar um evento… ou criar uma experiência que continua gerando valor, comunidade e vendas durante o ano inteiro?</p>
          <p className="mb-6">✨ Leve o ScribIA para o seu próximo evento. Transforme cada palestra em um ativo vivo da sua marca.</p>

          <div className="mt-4">
            <Button size="lg" className="bg-primary text-primary-foreground" onClick={handleCTAClick}>
              Quero manter meu público engajado com o ScribIA
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default OrganizadoresLanding;