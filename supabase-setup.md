# Configuração do Supabase para o Ateliê Rosa Costuras

Este guia irá ajudá-lo a configurar o Supabase como banco de dados para seu site.

## 1. Criar uma conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Crie uma conta (você pode usar GitHub ou Google)
4. Crie um novo projeto com:
   - Nome: `atelie-rosa-costuras`
   - Senha de banco de dados forte (guarde-a em um local seguro)
   - Região: escolha a mais próxima ao Brasil (provavelmente US East)

## 2. Criar as tabelas no banco de dados

Depois de criar o projeto, vá para a seção "Table Editor" no menu lateral e crie as seguintes tabelas:

### Tabela: categorias
```sql
create table categorias (
  id uuid default uuid_generate_v4() primary key,
  nome varchar(255) not null,
  descricao text,
  imagem_url text,
  created_at timestamp with time zone default now()
);

-- Inserir categorias iniciais
insert into categorias (nome, descricao) values
('Vestido', 'Vestidos para diversas ocasiões'),
('Blusa', 'Blusas e camisas'),
('Calça', 'Calças e shorts'),
('Saia', 'Saias curtas e longas'),
('Conjunto', 'Conjuntos completos'),
('Outros', 'Outros tipos de peças');
```

### Tabela: produtos
```sql
create table produtos (
  id uuid default uuid_generate_v4() primary key,
  nome varchar(255) not null,
  categoria_id uuid references categorias(id),
  descricao text,
  preco decimal(10,2),
  imagem_url text,
  disponivel boolean default true,
  destaque boolean default false,
  created_at timestamp with time zone default now()
);
```

### Tabela: clientes
```sql
create table clientes (
  id uuid default uuid_generate_v4() primary key,
  nome varchar(255) not null,
  email varchar(255),
  telefone varchar(20),
  endereco text,
  observacoes text,
  created_at timestamp with time zone default now()
);
```

### Tabela: pedidos
```sql
create table pedidos (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references clientes(id),
  data_pedido timestamp with time zone default now(),
  status varchar(50) default 'pendente',
  valor_total decimal(10,2),
  observacoes text,
  created_at timestamp with time zone default now()
);
```

### Tabela: itens_pedido
```sql
create table itens_pedido (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references pedidos(id),
  produto_id uuid references produtos(id),
  quantidade integer default 1,
  preco_unitario decimal(10,2),
  created_at timestamp with time zone default now()
);
```

## 3. Configurar Storage para imagens

1. Vá para a seção "Storage" no menu lateral
2. Crie um novo bucket chamado `imagens`
3. Dentro de "imagens", crie as pastas:
   - `produtos`
   - `categorias`
   - `site`
4. Configure as permissões para:
   - Leitura pública (todos podem ver)
   - Escrita apenas para usuários autenticados

## 4. Configurar autenticação

1. Vá para a seção "Authentication" no menu lateral
2. Em "Settings", configure:
   - Site URL: URL do seu site
   - Redirect URLs: URL do seu site + `/admin.html`
3. Crie um novo usuário administrativo em "Users":
   - Email: seu-email@exemplo.com
   - Senha: uma senha forte

## 5. Obter as credenciais da API

1. Vá para a seção "Settings" > "API"
2. Copie:
   - URL do projeto
   - chave anon/public (para o frontend)
   - chave service_role (use apenas no backend)

Estas informações serão necessárias para conectar seu site ao Supabase. 