// Configuração do Supabase
const SUPABASE_URL = 'https://toyzhbzsiowpbcwznwjl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveXpoYnpzaW93cGJjd3pud2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDY0OTYsImV4cCI6MjA2MDEyMjQ5Nn0.UGHyGhe60maNREy55zwy1JsTUA_S7pOigqK-uJdP944';

// Exporta as variáveis para uso global
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;

// Função para inicializar o cliente Supabase
function initSupabase() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Tentando inicializar o cliente Supabase...');
      
      // Verifica se o objeto supabase da biblioteca está disponível
      if (typeof supabase === 'undefined') {
        reject(new Error('❌ Objeto supabase não está disponível. A biblioteca foi carregada?'));
        return;
      }
      
      console.log('✅ Objeto supabase está disponível');
      
      // Inicializa o cliente
      if (typeof supabase.createClient === 'function') {
        console.log('✅ Função createClient está disponível');
        
        // Cria o cliente e o disponibiliza globalmente
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Cliente Supabase inicializado com sucesso:', window.supabaseClient);
        
        // Verifica se a API auth está disponível
        if (window.supabaseClient.auth) {
          console.log('✅ API auth está disponível');
          resolve(window.supabaseClient);
        } else {
          reject(new Error('❌ API auth não está disponível no cliente'));
        }
      } else {
        reject(new Error('❌ Função createClient não encontrada no objeto supabase'));
      }
    } catch (error) {
      reject(new Error('❌ Erro ao inicializar o cliente Supabase: ' + error.message));
    }
  });
}

// Funções de gerenciamento de categorias
const categorias = {
  // Obter todas as categorias
  async listar() {
    const { data, error } = await window.supabaseClient
      .from('categorias')
      .select('*')
      .order('nome');
      
    if (error) throw new Error(error.message);
    return data;
  },
  
  // Obter uma categoria por ID
  async buscar(id) {
    const { data, error } = await window.supabaseClient
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  },
  
  // Criar nova categoria
  async criar(categoria) {
    const { data, error } = await window.supabaseClient
      .from('categorias')
      .insert(categoria)
      .select();
      
    if (error) throw new Error(error.message);
    return data[0];
  },
  
  // Atualizar categoria
  async atualizar(id, categoria) {
    const { data, error } = await window.supabaseClient
      .from('categorias')
      .update(categoria)
      .eq('id', id)
      .select();
      
    if (error) throw new Error(error.message);
    return data[0];
  },
  
  // Excluir categoria
  async excluir(id) {
    const { error } = await window.supabaseClient
      .from('categorias')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(error.message);
    return true;
  }
};

// Funções de gerenciamento de produtos
const produtos = {
  // Obter todos os produtos
  async listar(filtros = {}) {
    try {
      console.log('Iniciando listagem de produtos com filtros:', filtros);
      
      // Verifica se o bucket de imagens existe e está configurado corretamente
      await storage.verificarBucket().catch(error => {
        console.warn('Aviso ao verificar bucket:', error);
      });
      
      let query = window.supabaseClient
        .from('produtos')
        .select(`
          *,
          categorias (
            id,
            nome
          )
        `);
      
      // Aplicar filtros
      if (filtros.categoria) {
        console.log('Aplicando filtro de categoria:', filtros.categoria);
        query = query.eq('categoria_id', filtros.categoria);
      }
      
      if (filtros.disponivel !== undefined) {
        console.log('Aplicando filtro de disponibilidade:', filtros.disponivel);
        query = query.eq('disponivel', filtros.disponivel);
      }
      
      if (filtros.destaque !== undefined) {
        console.log('Aplicando filtro de destaque:', filtros.destaque);
        query = query.eq('destaque', filtros.destaque);
      }
      
      if (filtros.busca) {
        console.log('Aplicando busca por texto:', filtros.busca);
        query = query.ilike('nome', `%${filtros.busca}%`);
      }
      
      // Ordenação padrão por data de criação decrescente
      query = query.order('created_at', { ascending: false });
      
      console.log('Executando query...');
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao listar produtos:', error);
        throw new Error(error.message);
      }

      // Log detalhado dos resultados
      console.log('Query executada com sucesso');
      console.log('Número de produtos encontrados:', data?.length || 0);
      
      // Processar URLs das imagens
      const processedData = data.map(produto => {
        if (produto.imagem_url) {
          console.log('Processando URL da imagem:', produto.imagem_url);
          // Se a URL já começa com http ou https, mantém como está
          if (!produto.imagem_url.startsWith('http')) {
            // Se não, constrói a URL pública do Supabase Storage
            const { data: { publicUrl } } = window.supabaseClient.storage
              .from('imagens')
              .getPublicUrl(produto.imagem_url);
            produto.imagem_url = publicUrl;
            console.log('URL processada:', produto.imagem_url);
          }
        } else {
          // Define uma imagem padrão se não houver imagem
          produto.imagem_url = '/images/no-image.svg';
          console.log('Usando imagem padrão para produto sem imagem');
        }
        return produto;
      });

      if (processedData?.length > 0) {
        console.log('Primeiro produto processado:', {
          id: processedData[0].id,
          nome: processedData[0].nome,
          categoria: processedData[0].categorias?.nome,
          imagem_url: processedData[0].imagem_url
        });
      }
      
      return processedData || [];
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      throw new Error('Falha ao carregar produtos: ' + error.message);
    }
  },
  
  // Obter produto por ID
  async buscar(id) {
    try {
      console.log('Buscando produto por ID:', id);
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .select(`
          *,
          categorias (
            id,
            nome
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      console.log('Produto encontrado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      throw new Error('Falha ao buscar produto: ' + error.message);
    }
  },
  
  // Criar novo produto
  async criar(produto) {
    try {
      console.log('Criando novo produto:', produto);
      const { data, error } = await window.supabaseClient
        .from('produtos')
        .insert([produto])
        .select();
      
      if (error) throw new Error(error.message);
      console.log('Produto criado com sucesso:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw new Error('Falha ao criar produto: ' + error.message);
    }
  },
  
  // Atualizar produto
  async atualizar(id, produto) {
    const { data, error } = await window.supabaseClient
      .from('produtos')
      .update(produto)
      .eq('id', id)
      .select();
      
    if (error) throw new Error(error.message);
    return data[0];
  },
  
  // Excluir produto
  async excluir(id) {
    const { error } = await window.supabaseClient
      .from('produtos')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(error.message);
    return true;
  }
};

// Funções de gerenciamento de clientes
const clientes = {
  // Obter todos os clientes
  async listar() {
    const { data, error } = await window.supabaseClient
      .from('clientes')
      .select('*')
      .order('nome');
      
    if (error) throw new Error(error.message);
    return data;
  },
  
  // Obter cliente por ID
  async buscar(id) {
    const { data, error } = await window.supabaseClient
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  },
  
  // Criar novo cliente
  async criar(cliente) {
    const { data, error } = await window.supabaseClient
      .from('clientes')
      .insert(cliente)
      .select();
      
    if (error) throw new Error(error.message);
    return data[0];
  },
  
  // Atualizar cliente
  async atualizar(id, cliente) {
    const { data, error } = await window.supabaseClient
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select();
      
    if (error) throw new Error(error.message);
    return data[0];
  },
  
  // Excluir cliente
  async excluir(id) {
    const { error } = await window.supabaseClient
      .from('clientes')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(error.message);
    return true;
  }
};

// Funções para upload de arquivos
const storage = {
  async verificarBucket() {
    try {
      console.log('Verificando bucket "imagens"...');
      
      // Primeiro, tenta listar os buckets para ver se temos permissão
      const { data: buckets, error: listError } = await window.supabaseClient.storage.listBuckets();
      
      if (listError) {
        // Se não tiver permissão, apenas loga o erro e continua
        console.warn('Aviso ao listar buckets:', listError.message);
        return false;
      }
      
      const bucket = buckets?.find(b => b.name === 'imagens');
      
      if (!bucket) {
        console.warn('Bucket "imagens" não encontrado. Verifique as configurações no painel do Supabase.');
        return false;
      }

      // Testa se conseguimos acessar o bucket fazendo uma listagem
      const { data: files, error: testError } = await window.supabaseClient.storage
        .from('imagens')
        .list();
      
      if (testError) {
        console.warn('Aviso ao acessar bucket:', testError.message);
        return false;
      }

      console.log('✅ Bucket "imagens" está acessível');
      return true;
    } catch (error) {
      console.warn('Aviso ao verificar bucket:', error.message);
      return false;
    }
  },

  async uploadImagem(file, pasta = '') {
    try {
      // Tenta verificar o bucket, mas não falha se não conseguir
      await storage.verificarBucket().catch(console.warn);
      
      const fileName = `${pasta}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      console.log('Fazendo upload:', fileName);
      
      const { data, error } = await window.supabaseClient.storage
        .from('imagens')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Obter URL pública direta sem transformações
      const { data: { publicUrl } } = window.supabaseClient.storage
        .from('imagens')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw new Error('Falha ao fazer upload: ' + error.message);
    }
  },
  
  // Excluir arquivo
  async excluirArquivo(url) {
    try {
      // Extrai o caminho do arquivo da URL
      const urlObj = new URL(url);
      const path = urlObj.pathname.split('imagens/')[1];
      
      if (!path) throw new Error('URL inválida');
      
      const { error } = await window.supabaseClient.storage
        .from('imagens')
        .remove([path]);
        
      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      throw new Error('Falha ao excluir arquivo: ' + error.message);
    }
  }
};

// Funções para migração de dados
const migracao = {
  async migrarGaleria() {
    try {
      console.log('Iniciando processo de migração...');
      
      // Verificar autenticação
      const session = await window.db.auth.checkSession();
      if (!session) {
        throw new Error('Você precisa estar autenticado para realizar a migração.');
      }
      
      // Verificar permissões do bucket e da tabela produtos
      await storage.verificarBucket();
      
      // Verificar permissões da tabela produtos com um teste
      console.log('Verificando permissões da tabela produtos...');
      const { error: testError } = await window.supabaseClient
        .from('produtos')
        .insert([{
          nome: 'Teste de Permissão',
          categoria_id: 0,
          disponivel: true,
          preco: 0
        }])
        .select()
        .single();
      
      if (testError?.message.includes('policy')) {
        throw new Error('As políticas de segurança da tabela "produtos" não estão configuradas corretamente. Configure as políticas de INSERT no painel do Supabase.');
      }
      
      // Se o teste foi bem sucedido, remover o produto de teste
      if (!testError) {
        await window.supabaseClient
          .from('produtos')
          .delete()
          .eq('nome', 'Teste de Permissão');
      }
      
      // Buscar dados do localStorage
      const items = JSON.parse(localStorage.getItem('galleryItems') || '[]');
      console.log('Dados encontrados no localStorage:', items.length, 'itens');
      
      if (!items.length) {
        return {
          success: false,
          message: 'Nenhum item encontrado para migração'
        };
      }

      // Criar categoria "Galeria Antiga" se não existir
      let categoria;
      const { data: categorias } = await window.supabaseClient
        .from('categorias')
        .select()
        .eq('nome', 'Galeria Antiga')
        .single();
      
      if (!categorias) {
        const { data: newCategoria, error: categoriaError } = await window.supabaseClient
          .from('categorias')
          .insert({ nome: 'Galeria Antiga' })
          .select()
          .single();
          
        if (categoriaError) throw new Error('Erro ao criar categoria: ' + categoriaError.message);
        categoria = newCategoria;
      } else {
        categoria = categorias;
      }

      // Contador de sucesso/erro
      let sucessos = 0;
      let erros = [];

      // Processar cada item
      for (const item of items) {
        try {
          console.log('Processando item:', item.title);
          
          // Preparar dados do produto
          const produtoData = {
            nome: item.title || 'Sem título',
            descricao: item.description || '',
            categoria_id: categoria.id,
            disponivel: true,
            preco: 0, // Preço padrão, pode ser atualizado depois
            destaque: false
          };

          // Se houver imagem, fazer upload
          if (item.image) {
            try {
              console.log('Processando imagem:', item.image);
              
              // Construir URL completa se for caminho local
              let imageUrl = item.image;
              if (!item.image.startsWith('http') && !item.image.startsWith('data:')) {
                imageUrl = window.location.origin + (item.image.startsWith('/') ? '' : '/') + item.image;
              }
              
              console.log('URL da imagem:', imageUrl);
              
              // Obter a imagem
              const response = await fetch(imageUrl);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const blob = await response.blob();
              const fileExt = blob.type.split('/')[1] || 'jpg';
              const fileName = `produtos/${Date.now()}-${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExt}`;
              
              console.log('Fazendo upload:', fileName, 'tipo:', blob.type);

              // Upload para o Supabase Storage
              const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                .from('imagens')
                .upload(fileName, blob, {
                  contentType: blob.type,
                  cacheControl: '3600'
                });

              if (uploadError) {
                console.error('Erro no upload:', uploadError);
                throw new Error('Erro no upload: ' + uploadError.message);
              }

              // Obter URL pública direta sem transformações
              const { data: { publicUrl } } = window.supabaseClient.storage
                .from('imagens')
                .getPublicUrl(uploadData.path);

              console.log('Upload concluído. URL pública:', publicUrl);
              produtoData.imagem_url = publicUrl;
              
            } catch (imageError) {
              console.error('Erro ao processar imagem:', imageError);
              throw new Error('Erro ao processar imagem: ' + imageError.message);
            }
          }

          // Inserir produto
          console.log('Inserindo produto:', produtoData);
          const { error: insertError } = await window.supabaseClient
            .from('produtos')
            .insert(produtoData);

          if (insertError) {
            console.error('Erro ao inserir produto:', insertError);
            throw new Error('Erro ao inserir produto: ' + insertError.message);
          }

          sucessos++;
          console.log('Item migrado com sucesso:', item.title);
        } catch (error) {
          console.error('Erro ao migrar item:', item.title, error);
          erros.push(`${item.title}: ${error.message}`);
        }
      }

      // Retornar resultado
      return {
        success: true,
        message: `Migração concluída. ${sucessos} produtos migrados com sucesso. ${erros.length} produtos não foram migrados devido a erros: ${erros.join(', ')}`
      };
    } catch (error) {
      console.error('Erro na migração:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// Função para inicializar o cliente Supabase e o objeto db
async function initializeDatabase() {
  try {
    console.log('Iniciando inicialização do banco de dados...');
    
    // Primeiro inicializa o cliente Supabase
    const supabaseClient = await initSupabase();
    console.log('✅ Cliente Supabase inicializado');

    // Inicializa o objeto auth
    const auth = {
      // Fazer login
      async login(email, password) {
        try {
          console.log('Tentando fazer login com:', email);
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            console.error('Erro no login:', error);
            throw error;
          }

          console.log('Login bem-sucedido:', data);
          return {
            data: {
              session: data.session,
              user: data.user
            },
            error: null
          };
        } catch (error) {
          console.error('Erro ao fazer login:', error);
          return {
            data: null,
            error
          };
        }
      },
      
      // Verificar se o usuário está logado
      async checkSession() {
        try {
          console.log('Verificando sessão...');
          const { data: { session }, error } = await supabaseClient.auth.getSession();
          
          if (error) {
            console.error('Erro ao verificar sessão:', error);
            throw error;
          }

          console.log('Sessão atual:', session);
          return session;
        } catch (error) {
          console.error('Erro ao verificar sessão:', error);
          return null;
        }
      },
      
      // Fazer logout
      async logout() {
        try {
          console.log('Fazendo logout...');
          const { error } = await supabaseClient.auth.signOut();
          
          if (error) {
            console.error('Erro ao fazer logout:', error);
            throw error;
          }

          console.log('Logout bem-sucedido');
          return true;
        } catch (error) {
          console.error('Erro ao fazer logout:', error);
          throw error;
        }
      },
      
      // Obter dados do usuário atual
      async getCurrentUser() {
        try {
          console.log('Obtendo usuário atual...');
          const { data: { user }, error } = await supabaseClient.auth.getUser();
          
          if (error) {
            console.error('Erro ao obter usuário:', error);
            throw error;
          }

          console.log('Usuário atual:', user);
          return user;
        } catch (error) {
          console.error('Erro ao obter usuário:', error);
          return null;
        }
      }
    };

    // Inicializa o objeto db global com as funções
    window.db = {
      supabaseClient,
      auth,
      login: auth.login,
      logout: auth.logout,
      checkSession: auth.checkSession,
      getCurrentUser: auth.getCurrentUser,
      categorias,
      produtos,
      clientes,
      storage,
      migracao,
      config: {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY
      }
    };

    console.log('✅ Objeto db inicializado com sucesso:', window.db);
    return window.db;
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    throw error;
  }
}

// Exporta a função de inicialização globalmente
window.initializeDatabase = initializeDatabase;

// Inicia a inicialização automaticamente
initializeDatabase().catch(error => {
  console.error('❌ Falha na inicialização automática:', error);
});

// Utiliza o cliente inicializado para as funções
const supabaseClient = window.supabaseClient;

// Verificação adicional antes de definir as funções
if (!supabaseClient) {
  console.error('❌ Cliente Supabase não foi inicializado corretamente. As funções podem não funcionar.');
} 